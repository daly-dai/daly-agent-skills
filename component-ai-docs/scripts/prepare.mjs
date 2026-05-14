#!/usr/bin/env node
/**
 * 统一入口：准备组件材料。
 *
 * 一次遍历项目文件，调度 Props 提取、关联类型搜索、使用示例采集，
 * 产出组件级缓存文件（.cache/<组件id>.json）。
 *
 * 用法:
 *   node prepare.mjs <file1> <file2> ... --project-root <dir> --output-dir <dir>
 *
 * 输出:
 *   .cache/<组件id>.json  (每个组件一个，含 componentName / id / sourceHash / props / referencedTypes / usages)
 *
 * 使用示例采集优先使用 TypeScript AST（精确归属），不可用时回退到正则。
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { resolve, join, relative, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import { processOne } from './extract-props.mjs';
import { walkDir, processComponent } from './extract-types.mjs';
import { findInFile, collectUsagesFromProgram } from './collect-usages.mjs';

// ============================================================
// 工具函数
// ============================================================

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

function generateId(name, filePath) {
  const sanitized = filePath
    .replace(/[\/\\]/g, '-')
    .replace(/\.(tsx|ts|jsx|js|mjs|cjs)$/i, '');
  return `${name}__${sanitized}`;
}

// ============================================================
// 参数解析
// ============================================================

function parseArgs(argv) {
  const opts = { filePaths: [], projectRoot: process.cwd(), outputDir: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--project-root' && argv[i + 1]) {
      opts.projectRoot = resolve(argv[++i]);
    } else if (argv[i] === '--output-dir' && argv[i + 1]) {
      opts.outputDir = resolve(argv[++i]);
    } else if (!argv[i].startsWith('--')) {
      opts.filePaths.push(resolve(argv[i]));
    }
  }
  return opts;
}

// ============================================================
// TypeScript 加载
// ============================================================

function loadTypeScript(projectRoot) {
  const pkgJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(pkgJsonPath)) return { ts: null };
  try {
    const require_ = createRequire(pkgJsonPath);
    const ts = require_('typescript');
    return { ts, require_ };
  } catch {
    return { ts: null };
  }
}

function createProgram(ts, projectRoot) {
  const tsconfigPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, 'tsconfig.json');
  if (!tsconfigPath) return null;

  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config, ts.sys, dirname(tsconfigPath), {}, tsconfigPath
  );

  return ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
}

// ============================================================
// 主流程
// ============================================================

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.filePaths.length === 0) {
    console.error('Usage: node prepare.mjs <file1> [file2 ...] --project-root <dir> --output-dir <dir>');
    process.exit(1);
  }

  const { filePaths, projectRoot, outputDir } = opts;

  // 1. 扫描项目文件（一次）
  console.error(`Scanning project files in ${projectRoot}...`);
  const allFiles = walkDir(projectRoot);
  console.error(`Found ${allFiles.length} source files`);

  // 2. 确保输出目录存在
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  // 3. 预先提取所有组件的名称和路径（用于批量 AST 使用采集）
  const componentMetas = [];
  for (const fp of filePaths) {
    const relPath = normalizePath(relative(projectRoot, fp));
    // 先通过 processOne 获取组件名
    try {
      const propsResult = processOne(fp, projectRoot);
      const componentName = propsResult.componentName;
      const id = generateId(componentName, relPath);
      componentMetas.push({ filePath: fp, relPath, componentName, id, propsResult });
    } catch {
      // 降级用文件名
      let name = basename(fp, extname(fp));
      if (name === 'index') name = basename(dirname(fp));
      const id = generateId(name, relPath);
      componentMetas.push({ filePath: fp, relPath, componentName: name, id, propsResult: null });
    }
  }

  // 4. 尝试 AST 批量采集使用示例
  let usageMap = null;
  const { ts } = loadTypeScript(projectRoot);
  if (ts) {
    console.error('Trying AST usage collection...');
    try {
      const program = createProgram(ts, projectRoot);
      if (program) {
        const componentNames = componentMetas.map(m => m.componentName);
        usageMap = collectUsagesFromProgram(ts, program, componentNames, projectRoot, {
          componentFiles: componentMetas.map(m => m.relPath),
        });
        console.error('AST usage collection succeeded');
      }
    } catch (err) {
      console.error(`AST usage collection failed: ${err.message}`);
    }
  }

  // 5. 逐个组件处理
  for (let i = 0; i < componentMetas.length; i++) {
    const meta = componentMetas[i];
    const fp = meta.filePath;
    console.error(`[${i + 1}/${componentMetas.length}] ${fp}`);

    try {
      // 5a. 提取 Props
      const propsResult = meta.propsResult || processOne(fp, projectRoot);
      const componentName = propsResult.componentName;
      const id = generateId(componentName, meta.relPath);

      // 5b. 搜索关联类型
      let referencedTypes = [];
      try {
        const typesResult = processComponent(fp, allFiles);
        if (typesResult) referencedTypes = typesResult.referencedTypes;
      } catch { /* types 失败不阻塞 */ }

      // 5c. 采集使用示例
      let allUsages = [];
      if (usageMap) {
        // AST 模式：从批量结果取
        allUsages = usageMap.get(componentName) || [];
      } else {
        // 回退：逐文件扫描
        for (const f of allFiles) {
          const found = findInFile(f, componentName);
          if (found && found.usages.length > 0) {
            allUsages.push(...found.usages);
          }
        }
      }

      // 5d. 合并输出
      const merged = {
        componentName,
        id,
        sourceHash: propsResult.sourceHash,
        props: propsResult.props,
        referencedTypes,
        usages: allUsages.slice(0, 5),
      };

      const outPath = join(outputDir, `${id}.json`);
      writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf-8');
      console.error(`  → ${outPath}`);
      console.error(`     ${merged.props.length} props, ${merged.referencedTypes.length} types, ${merged.usages.length} usages`);

    } catch (err) {
      console.error(`  ✗ ${fp}: ${err.message}`);
    }
  }

  console.error('Done.');
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) main();
