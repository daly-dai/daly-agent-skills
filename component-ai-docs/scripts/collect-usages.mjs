#!/usr/bin/env node
/**
 * 采集组件在项目中的使用示例。
 *
 * 搜索所有 .tsx/.ts 文件，找到组件的 import 语句和 JSX 调用，
 * 提取上下文代码块供 AI 筛选最佳示例。
 *
 * 用法:
 *   node collect-usages.mjs <CompA> <CompB> ... --project-root <dir>
 *
 * 输出 (JSON 数组):
 *   [
 *     {
 *       "componentName": "UserTable",
 *       "totalUsages": 12,
 *       "importFiles": ["src/pages/users/index.tsx", ...],
 *       "usages": [
 *         { "file": "src/pages/users/index.tsx", "line": 42,
 *           "importStatement": "import UserTable from '@/components/UserTable';",
 *           "codeBlock": "      <UserTable\n        data={users}\n        ..." }
 *       ]
 *     }
 *   ]
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { resolve, relative, join } from 'path';

// ============================================================
// 参数解析
// ============================================================

function parseArgs(argv) {
  const opts = { componentNames: [], projectRoot: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--project-root' && argv[i + 1]) {
      opts.projectRoot = resolve(argv[++i]);
    } else if (!argv[i].startsWith('--')) {
      opts.componentNames.push(argv[i]);
    }
  }
  return opts;
}

// ============================================================
// 递归遍历目录，收集所有 .ts/.tsx 文件
// ============================================================

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__', '.turbo', 'out', 'public',
]);

function walkDir(dir) {
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
// 在一个文件中搜索组件的 import 和 JSX 使用
// ============================================================

function findInFile(filePath, componentName) {
  let content;
  try { content = readFileSync(filePath, 'utf-8'); } catch { return null; }

  const lines = content.split('\n');

  // 找 import 语句
  const importRe = new RegExp(
    `import\\s+(?:type\\s+)?(?:\\{[^}]*\\b${componentName}\\b[^}]*\\}|\\b${componentName}\\b)\\s+from\\s+['"]([^'"]+)['"]`,
    'g'
  );
  const importMatches = [];
  let im;
  while ((im = importRe.exec(content)) !== null) {
    importMatches.push(im[0]);
  }

  if (importMatches.length === 0) return null; // 没用这个组件

  // 找 JSX 使用: <ComponentName
  const usageRe = new RegExp(`<${componentName}[\\s/>]`, 'g');
  const usages = [];
  let um;
  while ((um = usageRe.exec(content)) !== null) {
    const before = content.slice(0, um.index);
    const lineNum = before.split('\n').length;

    // 提取上下文 (~12 行，以使用行为中心)
    const start = Math.max(0, lineNum - 8);
    const end = Math.min(lines.length, lineNum + 5);
    const codeBlock = lines.slice(start - 1, end).map((l, i) => {
      const ln = start + i;
      const marker = ln === lineNum ? '>' : ' ';
      return `${marker}${String(ln).padStart(4, ' ')}| ${l}`;
    }).join('\n');

    usages.push({
      file: relative(process.cwd(), filePath).replace(/\\/g, '/'),
      line: lineNum,
      importStatement: importMatches[0],
      codeBlock,
    });
  }

  const relPath = relative(process.cwd(), filePath).replace(/\\/g, '/');

  return {
    file: relPath,
    importStatements: importMatches,
    usages,
    usageCount: usages.length,
  };
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

    // 如果只在 import 中用（如作为类型），仍记录
    // 去重并限制数量（最多 8 个使用点，避免输出过大）
    const uniqueUsages = allUsages.slice(0, 8);

    results.push({
      componentName: compName,
      totalUsages: allUsages.length,
      importFiles: importFiles.length > 0 ? importFiles.slice(0, 15) : [],
      usages: uniqueUsages,
    });

    console.error(`  ${compName}: ${importFiles.length} import locations, ${allUsages.length} JSX usages`);
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
