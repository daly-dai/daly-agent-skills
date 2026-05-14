#!/usr/bin/env node
/**
 * 扫描项目中的业务组件，生成 .component-list.json
 *
 * 用法:
 *   node scan-components.mjs [project-root]
 *   node scan-components.mjs --dir src/renderer
 *   node scan-components.mjs --patterns "src/renderer/components/**\/*.tsx,src/shared/**\/*.tsx"
 *   node scan-components.mjs --output ./my-list.json
 *
 * 输出: .ai/project-components/.component-list.json
 *
 * 依赖: typescript (从目标项目的 node_modules 加载，项目 devDependencies 需含 typescript)
 * 不可用时降级为手工解析。
 */

import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve, dirname, basename, extname } from 'path';

// ============================================================
// 配置
// ============================================================

const DEFAULT_PATTERNS = [
  'src/components/**/*.tsx',
  'components/**/*.tsx',
  'src/pages/**/components/**/*.tsx',
  'src/business/**/*.tsx',
  'src/widgets/**/*.tsx',
  'src/modules/**/components/**/*.tsx',
  'packages/*/src/components/**/*.tsx',
  'src/**/components/**/*.tsx',
];

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next',
  'coverage', '__pycache__', '.turbo', 'out', 'public',
]);

// ============================================================
// 参数解析
// ============================================================

function parseArgs(argv) {
  const opts = { projectRoot: process.cwd(), outputPath: null, patterns: null, dir: null };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir' && argv[i + 1]) {
      opts.dir = argv[++i];
    } else if (argv[i] === '--output' && argv[i + 1]) {
      opts.outputPath = resolve(argv[++i]);
    } else if (argv[i] === '--patterns' && argv[i + 1]) {
      opts.patterns = argv[++i].split(',').map(p => p.trim()).filter(Boolean);
    } else if (!argv[i].startsWith('--')) {
      opts.projectRoot = resolve(argv[i]);
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

function isPascalCase(name) {
  return /^[A-Z]/.test(name);
}

function generateId(name, filePath) {
  const sanitized = filePath
    .replace(/[\/\\]/g, '-')
    .replace(/\.(tsx|ts|jsx|js|mjs|cjs)$/i, '');
  return `${name}__${sanitized}`;
}

function globToRegex(pattern) {
  let src = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\x00')
    .replace(/\*/g, '[^/]*')
    .replace(/\x00/g, '.*');
  return new RegExp('^' + src + '$');
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
    return { ts: null, reason: 'typescript 未安装（devDependencies 中无 typescript）' };
  }
}

// ============================================================
// Program 创建
// ============================================================

function createProgram(ts, projectRoot, opts) {
  const tsconfigPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, 'tsconfig.json');
  if (!tsconfigPath) {
    throw new Error('找不到 tsconfig.json');
  }

  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config, ts.sys, dirname(tsconfigPath), {}, tsconfigPath
  );

  let fileNames = parsedConfig.fileNames.filter(f => {
    const rel = normalizePath(relative(projectRoot, f));
    if (rel.startsWith('..')) return false;
    for (const ed of EXCLUDE_DIRS) {
      if (rel.split('/').some(seg => seg === ed)) return false;
    }
    return true;
  });

  // --dir 过滤
  if (opts.dir) {
    const dirAbs = resolve(projectRoot, opts.dir);
    fileNames = fileNames.filter(f => normalizePath(f).startsWith(normalizePath(dirAbs)));
  }

  // --patterns 过滤
  const patterns = opts.patterns || DEFAULT_PATTERNS;
  const regexes = patterns.map(p => globToRegex(p));
  fileNames = fileNames.filter(f => {
    const rel = normalizePath(relative(projectRoot, f));
    return regexes.some(re => re.test(rel));
  });

  console.error(`Program files: ${fileNames.length} matched`);
  return ts.createProgram(fileNames, parsedConfig.options);
}

// ============================================================
// 组件提取（AST 遍历）
// ============================================================

function hasExportModifier(node) {
  if (!node.modifiers) return false;
  const ts = node.getSourceFile ? getTS(node) : null;
  return node.modifiers.some(m => m.kind === 93 /* ExportKeyword */);
}

function hasDefaultModifier(node) {
  if (!node.modifiers) return false;
  return node.modifiers.some(m => m.kind === 88 /* DefaultKeyword */);
}

function getTS(node) {
  // 从节点获取 ts 实例
  const sourceFile = node.getSourceFile();
  if (sourceFile && sourceFile.__ts) return sourceFile.__ts;
  return null;
}

function isExportDeclaration(node, ts) {
  return node.kind === ts.SyntaxKind.ExportDeclaration;
}

function isFunctionDeclaration(node, ts) {
  return node.kind === ts.SyntaxKind.FunctionDeclaration;
}

function isVariableStatement(node, ts) {
  return node.kind === ts.SyntaxKind.VariableStatement;
}

function isClassDeclaration(node, ts) {
  return node.kind === ts.SyntaxKind.ClassDeclaration;
}

function isImportDeclaration(node, ts) {
  return node.kind === ts.SyntaxKind.ImportDeclaration;
}

function isNamedImports(node, ts) {
  return node.kind === ts.SyntaxKind.NamedImports;
}

function isIdentifier(node, ts) {
  return node.kind === ts.SyntaxKind.Identifier;
}

function extractComponents(ts, program, projectRoot) {
  const components = [];       // { name, file, isDefault, barrelExportPaths }
  const barrelMap = new Map(); // barrelFilePath → [{ name, from }]
  const seenFiles = new Set(); // 防止重复

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;

    const filePath = normalizePath(sourceFile.fileName);
    if (filePath.includes('/node_modules/')) continue;

    const relPath = normalizePath(relative(projectRoot, filePath));
    if (relPath.startsWith('..')) continue;

    // 跳过排除目录
    const segments = relPath.split('/');
    if (segments.some(s => EXCLUDE_DIRS.has(s))) continue;

    // 只处理 .tsx
    if (!filePath.endsWith('.tsx')) continue;

    const fileComponents = [];
    const fileBarrelExports = [];

    ts.forEachChild(sourceFile, (node) => {
      // --- 1) export default function Button / export function Button
      if (ts.isFunctionDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
        if (hasExportModifier(node)) {
          fileComponents.push({
            name: node.name.text, file: relPath,
            isDefault: hasDefaultModifier(node),
          });
        }
        return;
      }

      // --- 2) export default Button = ... (forwardRef / memo / HOC)
      // 先找 export default 语句
      if (ts.isExportAssignment(node) && !node.isExportEquals) {
        // export default ButtonName
        if (ts.isIdentifier(node.expression)) {
          fileComponents.push({
            name: node.expression.text, file: relPath, isDefault: true,
          });
        }
        // export default memo(ButtonName) / forwardRef(ButtonName)
        else if (ts.isCallExpression(node.expression)) {
          const callArgs = node.expression;
          if (ts.isIdentifier(callArgs.expression)) {
            // 检查是否是 memo/forwardRef 等
            const wrapperName = callArgs.expression.text;
            if (['memo', 'forwardRef', 'lazy'].includes(wrapperName) && callArgs.arguments.length > 0) {
              const firstArg = callArgs.arguments[0];
              if (ts.isIdentifier(firstArg)) {
                fileComponents.push({
                  name: firstArg.text, file: relPath, isDefault: true,
                });
              } else if (ts.isArrowFunction(firstArg) || ts.isFunctionExpression(firstArg)) {
                // export default memo(() => {...}) — 匿名，用文件名
              }
            }
          }
        }
        return;
      }

      // --- 3) export const Button = ...
      if (ts.isVariableStatement(node) && hasExportModifier(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && isPascalCase(decl.name.text)) {
            fileComponents.push({
              name: decl.name.text, file: relPath,
              isDefault: false,
            });
          }
        }
        return;
      }

      // --- 4) export class Button
      if (ts.isClassDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
        if (hasExportModifier(node)) {
          fileComponents.push({
            name: node.name.text, file: relPath,
            isDefault: hasDefaultModifier(node),
          });
        }
        return;
      }

      // --- 5) export { Button } from './Button' (桶文件)
      if (ts.isExportDeclaration(node) && node.exportClause && node.moduleSpecifier) {
        if (ts.isNamedExports(node.exportClause)) {
          for (const el of node.exportClause.elements) {
            const exportedName = el.name.text;
            const fromPath = node.moduleSpecifier.text;
            fileBarrelExports.push({ name: exportedName, from: fromPath });
          }
        }
        return;
      }

      // --- 6) export { X } (重导出本文件符号)
      if (ts.isExportDeclaration(node) && node.exportClause && !node.moduleSpecifier) {
        if (ts.isNamedExports(node.exportClause)) {
          for (const el of node.exportClause.elements) {
            fileComponents.push({
              name: el.name.text, file: relPath, isDefault: false,
            });
          }
        }
        return;
      }
    });

    // 收集桶导出
    if (fileBarrelExports.length > 0) {
      barrelMap.set(relPath, fileBarrelExports);
    }

    // 收集组件
    for (const c of fileComponents) {
      if (!seenFiles.has(c.name + '::' + c.file)) {
        seenFiles.add(c.name + '::' + c.file);
        components.push({ ...c, refs: 0, barrelExportPaths: [] });
      }
    }

    // fallback: 文件没有任何导出声明，用文件名
    if (fileComponents.length === 0) {
      const name = basename(filePath, '.tsx');
      if (name !== 'index' && isPascalCase(name)) {
        if (!seenFiles.has(name + '::' + relPath)) {
          seenFiles.add(name + '::' + relPath);
          components.push({ name, file: relPath, isDefault: false, refs: 0, barrelExportPaths: [] });
        }
      }
    }
  }

  // --- 关联桶文件 ---
  for (const [barrelPath, exports] of barrelMap) {
    const barrelDir = dirname(barrelPath);
    for (const exp of exports) {
      const target = components.find(
        c => c.name === exp.name && dirname(c.file) === barrelDir
      );
      if (target) {
        if (!target.barrelExportPaths.includes(barrelPath)) {
          target.barrelExportPaths.push(barrelPath);
        }
      }
    }
  }

  return { components, barrelMap };
}

// ============================================================
// 引用计数（AST + 模块解析）
// ============================================================

function isBareSpecifier(specifier) {
  return !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('@/');
}

function countReferences(ts, program, components, projectRoot) {
  // 构建查找表：文件路径 → component
  const fileToComponent = new Map();
  for (const c of components) {
    const absPath = normalizePath(resolve(projectRoot, c.file));
    fileToComponent.set(absPath, c);
  }

  // 桶文件解析表：桶文件路径 → 目标组件
  const barrelToComponent = new Map();
  for (const c of components) {
    for (const bp of c.barrelExportPaths || []) {
      const absBarrel = normalizePath(resolve(projectRoot, bp));
      barrelToComponent.set(absBarrel, c);
    }
  }

  // 引用计数器（使用 Set 按来源文件去重）
  const refSets = new Map(); // component → Set<importingFileName>
  for (const c of components) refSets.set(c, new Set());

  const compilerOptions = program.getCompilerOptions();

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;

    const importingFile = normalizePath(sourceFile.fileName);
    if (importingFile.includes('/node_modules/')) continue;

    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isImportDeclaration(node)) return;
      if (!node.importClause?.namedBindings) return;
      if (!ts.isNamedImports(node.importClause.namedBindings)) return;

      const specifier = node.moduleSpecifier.text;

      // 过滤 bare specifier（三方包）
      if (isBareSpecifier(specifier)) return;

      // TypeScript 模块解析
      const resolved = ts.resolveModuleName(
        specifier,
        sourceFile.fileName,
        compilerOptions,
        ts.sys
      );

      if (!resolved.resolvedModule?.resolvedFileName) return;
      const targetFile = normalizePath(resolved.resolvedModule.resolvedFileName);

      // 找到目标组件：直接匹配文件或桶文件
      let targetComp = fileToComponent.get(targetFile);
      if (!targetComp) targetComp = barrelToComponent.get(targetFile);
      if (!targetComp) return;

      // 检查引入的具体名称是否匹配
      for (const el of node.importClause.namedBindings.elements) {
        if (el.name.text === targetComp.name) {
          refSets.get(targetComp).add(importingFile);
        }
      }
    });
  }

  for (const c of components) {
    c.refs = refSets.has(c) ? refSets.get(c).size : 0;
  }
}

// ============================================================
// 优先级
// ============================================================

function assignPriorities(components) {
  for (const c of components) {
    if (c.refs >= 8) {
      c.priority = 'high';
    } else if (c.refs >= 3) {
      c.priority = 'medium';
    } else {
      c.priority = 'low';
    }
  }
}

function groupAndSort(components) {
  const grouped = { high: [], medium: [], low: [] };
  for (const c of components) {
    grouped[c.priority].push({
      id: c.id,
      name: c.name,
      file: c.file,
      refs: c.refs,
      status: 'pending',
      barrelExportPaths: c.barrelExportPaths || [],
    });
  }
  for (const g of Object.values(grouped)) {
    g.sort((a, b) => b.refs - a.refs);
  }
  return grouped;
}

// ============================================================
// 输出
// ============================================================

function writeOutput(grouped, opts, projectRoot) {
  const listOutput = opts.outputPath || join(projectRoot, '.ai', 'project-components', '.component-list.json');
  const outDir = dirname(listOutput);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const output = {
    createdAt: new Date().toISOString().split('T')[0],
    high: grouped.high,
    medium: grouped.medium,
    low: grouped.low,
  };

  writeFileSync(listOutput, JSON.stringify(output, null, 2), 'utf-8');

  console.error('');
  console.error('=== Done ===');
  console.error(`  High   : ${grouped.high.length}`);
  console.error(`  Medium : ${grouped.medium.length}`);
  console.error(`  Low    : ${grouped.low.length}`);
  console.error(`  Output : ${listOutput}`);

  if (grouped.high.length + grouped.medium.length + grouped.low.length > 30) {
    console.error('');
    console.error('WARNING: More than 30 components found. Consider narrowing the scan scope with --dir.');
  }
}

// ============================================================
// 主流程
// ============================================================

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { projectRoot } = opts;

  console.error('=== Component Scanner (AST) ===');
  console.error(`Project root : ${projectRoot}`);
  console.error('');

  // 1. 加载 TypeScript
  const { ts, reason } = loadTypeScript(projectRoot);
  if (!ts) {
    console.error(`ERROR: ${reason}`);
    console.error('This skill requires TypeScript to be installed in the project devDependencies.');
    console.error('For non-TypeScript projects, use the fallback version: component-ai-docs-fallback');
    process.exit(1);
  }

  // 2. 创建 Program
  let program;
  try {
    program = createProgram(ts, projectRoot, opts);
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }

  // 3. 提取组件
  console.error('Extracting components...');
  const { components } = extractComponents(ts, program, projectRoot);
  console.error(`Found ${components.length} component exports`);

  if (components.length === 0) {
    console.error('');
    console.error('No component files matched any pattern.');
    console.error('Try: node scan-components.mjs --dir <path>');
    console.error('  or: node scan-components.mjs --patterns "your/glob/**/*.tsx"');
    process.exit(1);
  }

  // 4. 引用计数
  console.error('Counting references...');
  let done = 0;
  countReferences(ts, program, components, projectRoot);
  for (const c of components) {
    done++;
    if (done % 10 === 0 || done === components.length) {
      console.error(`  ${done}/${components.length} components counted`);
    }
  }

  // 5. 优先级
  assignPriorities(components);

  // 6. 生成 id
  for (const c of components) {
    c.id = generateId(c.name, c.file);
  }

  // 7. 分组排序 + 输出
  const grouped = groupAndSort(components);
  writeOutput(grouped, opts, projectRoot);
}

main();
