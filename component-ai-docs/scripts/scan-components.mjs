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
 * 零外部依赖，仅使用 Node 内置模块。
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync } from 'fs';
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

const SOURCE_EXTS = new Set(['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs']);
const COMPONENT_EXTS = new Set(['.tsx']);

// ============================================================
// 参数解析
// ============================================================

function parseArgs(argv) {
  const opts = { projectRoot: process.cwd(), outputPath: null, patterns: null };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir' && argv[i + 1]) {
      opts.projectRoot = resolve(argv[++i]);
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
// Glob → Regex 转换
// ============================================================

function globToRegex(pattern) {
  let src = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\x00')
    .replace(/\*/g, '[^/]*')
    .replace(/\x00/g, '.*');
  return new RegExp('^' + src + '$');
}

// ============================================================
// 递归遍历目录
// ============================================================

function walkDir(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results; // 权限不足，跳过
  }

  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry)) continue;

    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (stat.isFile()) {
      const ext = extname(entry).toLowerCase();
      if (SOURCE_EXTS.has(ext) || ext === '.tsx') {
        results.push(fullPath);
      }
    }
  }

  return results;
}

// ============================================================
// 从 .tsx 文件中提取组件名
// ============================================================

function extractComponents(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const found = [];
  const lineCount = content.split('\n').length;

  // 1) export default function ComponentName
  let m = content.match(/export\s+default\s+function\s+(\w+)/);
  if (m && m[1][0] === m[1][0].toUpperCase()) {
    found.push({ name: m[1], isDefault: true });
  }

  // 2) export default memo(ComponentName) / forwardRef(ComponentName) / ComponentName
  if (found.length === 0) {
    m = content.match(/export\s+default\s+(?:memo\s*\(\s*|forwardRef\s*\(\s*)?(\w+)/);
    if (m && m[1][0] === m[1][0].toUpperCase() && m[1] !== 'function') {
      found.push({ name: m[1], isDefault: true });
    }
  }

  // 3) export const ComponentName / export function ComponentName / export class ComponentName
  const namedRe = /export\s+(?:const|function|class)\s+(\w+)/g;
  while ((m = namedRe.exec(content)) !== null) {
    if (m[1][0] === m[1][0].toUpperCase() && !found.some(c => c.name === m[1])) {
      found.push({ name: m[1], isDefault: false });
    }
  }

  // 4) export { X, Y }
  m = content.match(/export\s*\{\s*([^}]+)\s*\}/);
  if (m) {
    const names = m[1].split(',').map(s => s.trim()).filter(s => s && s[0] === s[0].toUpperCase());
    for (const name of names) {
      if (!found.some(c => c.name === name)) {
        found.push({ name, isDefault: false });
      }
    }
  }

  // 检查是否有子组件 (ComponentName.Sub = ...)
  const hasSub = /\.\w+\s*=\s*(?:memo\s*\(|forwardRef\s*\(|function|\([\s\S]*?\)\s*=>|React\.)?/m.test(content);

  return { components: found, lineCount, hasSubComponents: hasSub };
}

// ============================================================
// 统计 import 引用次数
// ============================================================

function countReferences(componentName, allFiles) {
  const re = new RegExp(
    `import\\s+(?:type\\s+)?(?:\\{[^}]*\\b${componentName}\\b[^}]*\\}|\\b${componentName}\\b)\\s+from`,
    'g'
  );
  let count = 0;
  for (const file of allFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      let m;
      while ((m = re.exec(content)) !== null) count++;
    } catch {
      // 跳过无法读取的文件
    }
  }
  return count;
}

// ============================================================
// 主流程
// ============================================================

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { projectRoot } = opts;
  const patterns = opts.patterns || DEFAULT_PATTERNS;
  const listOutput = opts.outputPath || join(projectRoot, '.ai', 'project-components', '.component-list.json');

  console.log('=== Component Scanner ===');
  console.log(`Project root : ${projectRoot}`);
  console.log(`Patterns     : ${patterns.length} patterns`);
  console.log('');

  // ---- 收集所有源文件 ----
  const allSourceFiles = walkDir(projectRoot);
  const allTsxFiles = allSourceFiles.filter(f => extname(f).toLowerCase() === '.tsx');

  console.log(`Source files : ${allSourceFiles.length} total (${allTsxFiles.length} .tsx)`);

  // ---- 匹配 pattern ----
  const regexes = patterns.map(p => globToRegex(p));
  const matchedFiles = [];

  for (const file of allTsxFiles) {
    const rel = relative(projectRoot, file).replace(/\\/g, '/');
    for (const re of regexes) {
      if (re.test(rel)) {
        matchedFiles.push(file);
        break;
      }
    }
  }

  console.log(`Matched      : ${matchedFiles.length} component files`);

  if (matchedFiles.length === 0) {
    console.log('');
    console.log('No component files matched any pattern.');
    console.log('Try: node scan-components.mjs --dir <path>');
    console.log('  or: node scan-components.mjs --patterns "your/glob/**/*.tsx"');
    process.exit(1);
  }

  // ---- 按目录分组展示 ----
  const dirCounts = {};
  for (const f of matchedFiles) {
    const d = dirname(relative(projectRoot, f)).replace(/\\/g, '/');
    dirCounts[d] = (dirCounts[d] || 0) + 1;
  }
  console.log('');
  console.log('By directory:');
  for (const [dir, count] of Object.entries(dirCounts).sort()) {
    console.log(`  ${dir}/  (${count} files)`);
  }

  // ---- 提取组件 ----
  console.log('');
  console.log('Extracting component names...');

  const components = [];

  for (const file of matchedFiles) {
    const relPath = relative(projectRoot, file).replace(/\\/g, '/');
    try {
      const { components: extracted, lineCount, hasSubComponents } = extractComponents(file);

      if (extracted.length === 0) {
        // fallback: 用文件名作为组件名
        const name = basename(file, '.tsx');
        components.push({ name, file: relPath, refs: 0, lineCount, hasSubComponents: false });
      } else {
        for (const c of extracted) {
          components.push({ name: c.name, file: relPath, refs: 0, lineCount, hasSubComponents });
        }
      }
    } catch (err) {
      console.error(`  SKIP ${relPath} — ${err.message}`);
    }
  }

  console.log(`Found ${components.length} components`);

  // ---- 统计引用 ----
  console.log('');
  console.log('Counting references...');

  const uniqueNames = [...new Set(components.map(c => c.name))];
  let done = 0;
  for (const name of uniqueNames) {
    const refs = countReferences(name, allSourceFiles);
    for (const c of components) {
      if (c.name === name) c.refs = refs;
    }
    done++;
    if (done % 10 === 0 || done === uniqueNames.length) {
      console.log(`  ${done}/${uniqueNames.length} names counted`);
    }
  }

  // ---- 优先级判定 ----
  // 规则按顺序套用，命中即停：
  //   1. refs >= 8                         → high
  //   2. refs >= 3                         → medium
  //   3. refs > 0 且有子组件或行数 > 300    → medium（有人用的大组件，至少值得关注）
  //   4. 其余                              → low
  for (const c of components) {
    if (c.refs >= 8) {
      c.priority = 'high';
    } else if (c.refs >= 3) {
      c.priority = 'medium';
    } else if (c.refs > 0 && (c.hasSubComponents || c.lineCount > 300)) {
      c.priority = 'medium';
    } else {
      c.priority = 'low';
    }
    // 清理内部字段
    delete c.lineCount;
    delete c.hasSubComponents;
    c.status = 'pending';
  }

  // ---- 分组排序 ----
  const grouped = { high: [], medium: [], low: [] };
  for (const c of components) {
    grouped[c.priority].push({ name: c.name, file: c.file, refs: c.refs, status: c.status });
    delete c.priority;
  }
  for (const g of Object.values(grouped)) {
    g.sort((a, b) => b.refs - a.refs);
  }

  // ---- 写入 ----
  const outDir = dirname(listOutput);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const output = {
    createdAt: new Date().toISOString().split('T')[0],
    high: grouped.high,
    medium: grouped.medium,
    low: grouped.low,
  };

  writeFileSync(listOutput, JSON.stringify(output, null, 2), 'utf-8');

  // ---- 汇总 ----
  console.log('');
  console.log('=== Done ===');
  console.log(`  High   : ${grouped.high.length}`);
  console.log(`  Medium : ${grouped.medium.length}`);
  console.log(`  Low    : ${grouped.low.length}`);
  console.log(`  Output : ${listOutput}`);

  if (components.length > 30) {
    console.log('');
    console.log('WARNING: More than 30 components found. Consider narrowing the scan scope with --dir.');
  }
}

main();
