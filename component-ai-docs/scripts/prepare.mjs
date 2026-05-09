#!/usr/bin/env node
/**
 * 统一入口：准备组件材料。
 *
 * 一次遍历项目文件，调度 Props 提取、关联类型搜索、使用示例采集，
 * 产出组件级缓存文件（.cache/<组件名>.json）。
 *
 * 用法:
 *   node prepare.mjs <file1> <file2> ... --project-root <dir> --output-dir <dir>
 *
 * 输出:
 *   .cache/<组件名>.json  (每个组件一个，含 componentName / sourceHash / props / referencedTypes / usages)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';

import { probeStrategy, processOne } from './extract-props.mjs';
import { walkDir, processComponent } from './extract-types.mjs';
import { findInFile } from './collect-usages.mjs';

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
// 主流程
// ============================================================

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.filePaths.length === 0) {
    console.error('Usage: node prepare.mjs <file1> [file2 ...] --project-root <dir> --output-dir <dir>');
    process.exit(1);
  }

  const { filePaths, projectRoot, outputDir } = opts;

  // 1. 探测 react-docgen 策略（一次）
  console.error('Probing react-docgen strategy...');
  probeStrategy(projectRoot);

  // 2. 扫描项目文件（一次）
  console.error(`Scanning project files in ${projectRoot}...`);
  const allFiles = walkDir(projectRoot);
  console.error(`Found ${allFiles.length} source files`);

  // 3. 确保输出目录存在
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  // 4. 逐个组件处理（独立 try/catch，一个报错不影响其他）
  for (let i = 0; i < filePaths.length; i++) {
    const fp = filePaths[i];
    console.error(`[${i + 1}/${filePaths.length}] ${fp}`);

    try {
      // 4a. 提取 Props
      const propsResult = processOne(fp, projectRoot);
      const componentName = propsResult.componentName;

      // 4b. 搜索关联类型
      let referencedTypes = [];
      try {
        const typesResult = processComponent(fp, allFiles);
        if (typesResult) referencedTypes = typesResult.referencedTypes;
      } catch { /* types 失败不阻塞 */ }

      // 4c. 采集使用示例
      const allUsages = [];
      for (const f of allFiles) {
        const found = findInFile(f, componentName);
        if (found && found.usages.length > 0) {
          allUsages.push(...found.usages);
        }
      }

      // 4d. 合并输出
      const merged = {
        componentName,
        sourceHash: propsResult.sourceHash,
        props: propsResult.props,
        referencedTypes,
        usages: allUsages.slice(0, 5),
      };

      const outPath = join(outputDir, `${componentName}.json`);
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
