#!/usr/bin/env node
/**
 * 采集组件在项目中的使用示例。
 *
 * 优先使用 TypeScript AST（typeChecker.getSymbolAtLocation 精确归属），
 * 不可用时回退到正则匹配。
 *
 * 用法:
 *   node collect-usages.mjs <CompA> <CompB> ... --project-root <dir>
 *
 * 输出 (JSON):
 *   [
 *     {
 *       "componentName": "Button",
 *       "totalUsages": 12,
 *       "importFiles": ["src/pages/users/index.tsx", ...],
 *       "usages": [
 *         { "file": "src/pages/users/index.tsx", "line": 42,
 *           "importStatement": "import { Button } from '@/components';",
 *           "codeBlock": "      <Button\n        type=\"primary\">提交</Button>" }
 *       ]
 *     }
 *   ]
 */

import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, relative, join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

// ============================================================
// 参数解析
// ============================================================

function parseArgs(argv) {
  const opts = { componentNames: [], projectRoot: process.cwd(), outputPath: null, outputDir: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--project-root' && argv[i + 1]) {
      opts.projectRoot = resolve(argv[++i]);
    } else if (argv[i] === '--output' && argv[i + 1]) {
      opts.outputPath = resolve(argv[++i]);
    } else if (argv[i] === '--output-dir' && argv[i + 1]) {
      opts.outputDir = resolve(argv[++i]);
    } else if (!argv[i].startsWith('--')) {
      opts.componentNames.push(argv[i]);
    }
  }
  return opts;
}

// ============================================================
// 工具函数
// ============================================================

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

// ============================================================
// 递归遍历目录
// ============================================================

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__', '.turbo', 'out', 'public',
]);

export function walkDir(dir) {
  const results = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return results; }
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    let s;
    try { s = statSync(fullPath); } catch { continue; }
    if (s.isDirectory()) { results.push(...walkDir(fullPath)); }
    else if (s.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry)) { results.push(fullPath); }
  }
  return results;
}

// ============================================================
// 正则 fallback: findInFile
// ============================================================

export function findInFile(filePath, componentName) {
  let content;
  try { content = readFileSync(filePath, 'utf-8'); } catch { return null; }

  const lines = content.split('\n');

  const importRe = new RegExp(
    `import\\s+(?:type\\s+)?(?:\\{[^}]*\\b${componentName}\\b[^}]*\\}|\\b${componentName}\\b)\\s+from\\s+['"]([^'"]+)['"]`,
    'g'
  );
  const importMatches = [];
  let im;
  while ((im = importRe.exec(content)) !== null) {
    importMatches.push(im[0]);
  }

  if (importMatches.length === 0) return null;

  const usageRe = new RegExp(`<${componentName}[\\s/>]`, 'g');
  const usages = [];
  let um;
  while ((um = usageRe.exec(content)) !== null) {
    const before = content.slice(0, um.index);
    const lineNum = before.split('\n').length;

    const start = Math.max(0, lineNum - 5);
    const end = Math.min(lines.length, lineNum + 4);
    const codeBlock = lines.slice(start - 1, end).map((l, i) => {
      const ln = start + i;
      const marker = ln === lineNum ? '>' : ' ';
      return `${marker}${String(ln).padStart(4, ' ')}| ${l}`;
    }).join('\n');

    usages.push({
      file: normalizePath(relative(process.cwd(), filePath)),
      line: lineNum,
      importStatement: importMatches[0],
      codeBlock,
    });
  }

  const relPath = normalizePath(relative(process.cwd(), filePath));

  return {
    file: relPath,
    importStatements: importMatches,
    usages,
    usageCount: usages.length,
  };
}

// ============================================================
// TypeScript 加载
// ============================================================

function loadTypeScript(projectRoot) {
  const pkgJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    return { ts: null, reason: '无 package.json' };
  }
  try {
    const require_ = createRequire(pkgJsonPath);
    const ts = require_('typescript');
    return { ts, require_ };
  } catch {
    return { ts: null, reason: 'typescript 未安装' };
  }
}

// ============================================================
// AST: 从 Program 批量采集 JSX 使用
// ============================================================

export function collectUsagesFromProgram(ts, program, componentNames, projectRoot, opts = {}) {
  const typeChecker = program.getTypeChecker();
  const results = new Map();
  for (const name of componentNames) results.set(name, []);

  // 构建组件声明文件集合（用于判断 JSX 标签归属）
  const knownComponentFiles = new Set();
  if (opts.componentFiles) {
    for (const f of opts.componentFiles) {
      knownComponentFiles.add(normalizePath(resolve(projectRoot, f)));
    }
  }
  // 也加入桶文件路径
  if (opts.barrelExportPaths) {
    for (const f of opts.barrelExportPaths) {
      knownComponentFiles.add(normalizePath(resolve(projectRoot, f)));
    }
  }

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    if (sourceFile.fileName.includes('node_modules')) continue;

    const fileRel = normalizePath(relative(projectRoot, sourceFile.fileName));
    const content = sourceFile.text;
    const lines = content.split('\n');

    // 遍历 JSX 节点
    visitJsxElements(ts, sourceFile, (tagName, tagNameNode) => {
      if (!componentNames.includes(tagName)) return;

      // 用 TypeChecker 定位符号的声明文件
      let belongsToProject = false;

      try {
        const symbol = typeChecker.getSymbolAtLocation(tagNameNode);
        if (symbol?.declarations?.length) {
          const declFile = normalizePath(symbol.declarations[0].getSourceFile().fileName);

          // 三重判断：声明文件在已知项目组件中
          if (knownComponentFiles.size > 0) {
            belongsToProject = knownComponentFiles.has(declFile);
          } else {
            // 没有已知文件列表时：只要不在 node_modules 就算项目内
            belongsToProject = !declFile.includes('/node_modules/');
          }
        }
      } catch {
        // getSymbolAtLocation 可能报错（类型不完整的项目），降级为不过滤
        belongsToProject = true;
      }

      if (!belongsToProject) return;

      // 提取行号
      const pos = tagNameNode.getStart(sourceFile);
      const { line: lineNum } = sourceFile.getLineAndCharacterOfPosition(pos);

      // 提取代码块 (±4 行)
      const start = Math.max(0, lineNum - 4);
      const end = Math.min(lines.length, lineNum + 4 + 1);
      const codeBlock = lines.slice(start, end).map((l, i) => {
        const ln = start + i + 1;
        const marker = ln === lineNum + 1 ? '>' : ' ';
        return `${marker}${String(ln).padStart(4, ' ')}| ${l}`;
      }).join('\n');

      // 尝试提取 import 语句
      let importStatement = '';
      const importRe = new RegExp(
        `import\\s+(?:type\\s+)?(?:\\{[^}]*\\b${tagName}\\b[^}]*\\}|\\b${tagName}\\b)\\s+from\\s+['"]([^'"]+)['"]`,
        'g'
      );
      const im = importRe.exec(content);
      if (im) importStatement = im[0];

      results.get(tagName).push({
        file: fileRel,
        line: lineNum + 1,
        importStatement,
        codeBlock,
      });
    });
  }

  return results;
}

function visitJsxElements(ts, sourceFile, callback) {
  function visit(node) {
    if (ts.isJsxElement(node)) {
      const tagNameNode = node.openingElement.tagName;
      const tagName = getTagName(tagNameNode);
      if (tagName) {
        callback(tagName, tagNameNode);
      }
    } else if (ts.isJsxSelfClosingElement(node)) {
      const tagNameNode = node.tagName;
      const tagName = getTagName(tagNameNode);
      if (tagName) {
        callback(tagName, tagNameNode);
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
}

function getTagName(tagNameNode) {
  if (!tagNameNode) return null;
  // Identifier / JsxIdentifier — both have .text
  if (tagNameNode.text !== undefined) return tagNameNode.text;
  // PropertyAccessExpression: <antd.Button> — extract 'Button'
  if (tagNameNode.name && tagNameNode.expression) {
    return tagNameNode.name.text;
  }
  return null;
}

// ============================================================
// 主流程
// ============================================================

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.componentNames.length === 0) {
    console.error('Usage: node collect-usages.mjs <CompA> [CompB ...] --project-root <dir>');
    process.exit(1);
  }

  console.error(`Scanning project files in ${opts.projectRoot}...`);

  // 尝试 AST
  const { ts } = loadTypeScript(opts.projectRoot);

  if (ts) {
    console.error('Using TypeScript AST mode...');

    const tsconfigPath = ts.findConfigFile(opts.projectRoot, ts.sys.fileExists, 'tsconfig.json');
    if (tsconfigPath) {
      try {
        const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
        const parsedConfig = ts.parseJsonConfigFileContent(
          configFile.config, ts.sys, dirname(tsconfigPath), {}, tsconfigPath
        );

        const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
        const usageMap = collectUsagesFromProgram(ts, program, opts.componentNames, opts.projectRoot);

        // 转换为输出格式
        const results = [];
        for (const compName of opts.componentNames) {
          const usages = usageMap.get(compName) || [];
          const uniqueUsages = usages.slice(0, 5);
          const importFiles = [...new Set(usages.map(u => u.file))];

          results.push({
            componentName: compName,
            totalUsages: usages.length,
            importFiles: importFiles.length > 0 ? importFiles.slice(0, 15) : [],
            usages: uniqueUsages,
          });

          console.error(`  ${compName}: ${importFiles.length} imports, ${usages.length} JSX usages`);
        }

        writeResults(results, opts);
        return;
      } catch (err) {
        console.error(`AST mode failed: ${err.message}`);
        console.error('Falling back to regex mode...');
      }
    }
  }

  // 降级：正则模式
  console.error('Using regex fallback mode...');
  const allSourceFiles = walkDir(opts.projectRoot);
  console.error(`Found ${allSourceFiles.length} source files`);

  const results = [];
  for (const compName of opts.componentNames) {
    console.error(`Searching: ${compName}`);
    const importFiles = [];
    const allUsages = [];

    for (const file of allSourceFiles) {
      const found = findInFile(file, compName);
      if (found) {
        importFiles.push(found.file);
        if (found.usages.length > 0) {
          allUsages.push(...found.usages);
        }
      }
    }

    const uniqueUsages = allUsages.slice(0, 5);

    results.push({
      componentName: compName,
      totalUsages: allUsages.length,
      importFiles: importFiles.length > 0 ? importFiles.slice(0, 15) : [],
      usages: uniqueUsages,
    });

    console.error(`  ${compName}: ${importFiles.length} imports, ${allUsages.length} JSX usages`);
  }

  writeResults(results, opts);
}

function writeResults(results, opts) {
  if (opts.outputPath) {
    const json = JSON.stringify(results, null, 2);
    const outDir = dirname(opts.outputPath);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(opts.outputPath, json, 'utf-8');
    console.error(`Saved index: ${opts.outputPath}`);
  }

  if (opts.outputDir) {
    if (!existsSync(opts.outputDir)) mkdirSync(opts.outputDir, { recursive: true });
    for (const r of results) {
      const f = join(opts.outputDir, `${r.componentName}.json`);
      writeFileSync(f, JSON.stringify(r, null, 2), 'utf-8');
    }
    console.error(`Saved ${results.length} per-component files: ${opts.outputDir}`);
  }

  const summary = results.map(r => ({
    componentName: r.componentName,
    totalUsages: r.totalUsages,
    importFileCount: r.importFiles.length,
  }));
  console.log(JSON.stringify(summary, null, 2));
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) main();
