#!/usr/bin/env node
/**
 * 从组件 Props 中提取引用的外部类型，并找到它们的定义。
 *
 * 用法:
 *   node extract-types.mjs <file1> [file2 ...] --project-root <dir>
 *
 * 输出 (JSON 数组):
 *   [
 *     {
 *       "componentName": "UserTable",
 *       "file": "src/components/UserTable.tsx",
 *       "referencedTypes": [
 *         { "name": "User", "definedIn": "src/types/user.ts", "line": 5,
 *           "definition": "interface User {\n  id: number;\n  name: string;\n}" }
 *       ]
 *     }
 *   ]
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { resolve, relative, join, basename, extname, dirname } from 'path';

// ============================================================
// 参数解析
// ============================================================

function parseArgs(argv) {
  const opts = { filePaths: [], projectRoot: process.cwd(), outputPath: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--project-root' && argv[i + 1]) {
      opts.projectRoot = resolve(argv[++i]);
    } else if (argv[i] === '--output' && argv[i + 1]) {
      opts.outputPath = resolve(argv[++i]);
    } else if (!argv[i].startsWith('--')) {
      opts.filePaths.push(resolve(argv[i]));
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
    else if (s.isFile() && /\.(ts|tsx)$/.test(entry)) { results.push(fullPath); }
  }
  return results;
}

// ============================================================
// 从类型字符串中提取 PascalCase 标识符
// ============================================================

function extractTypeNames(typeStr) {
  const names = [];
  const re = /\b([A-Z][a-zA-Z0-9_]*)\b/g;
  let m;
  while ((m = re.exec(typeStr)) !== null) {
    names.push(m[1]);
  }
  return [...new Set(names)];
}

// ============================================================
// 在项目中搜索类型定义
// ============================================================

function findTypeDefinition(typeName, allFiles) {
  const ifaceRe = new RegExp(`interface\\s+${typeName}\\b`);
  const typeRe = new RegExp(`type\\s+${typeName}\\s*=`);

  for (const file of allFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      let m = content.match(ifaceRe);
      const isInterface = !!m;

      if (!m) m = content.match(typeRe);
      if (!m) continue;

      // 找到定义行
      const before = content.slice(0, m.index);
      const line = before.split('\n').length;

      // 提取定义块（从匹配位置到匹配的 } 结束）
      const startIdx = m.index;
      const rest = content.slice(startIdx);
      let depth = 0;
      let endIdx = 0;
      let started = false;

      for (let i = 0; i < rest.length; i++) {
        if (rest[i] === '{') { depth++; started = true; }
        else if (rest[i] === '}') {
          depth--;
          if (started && depth === 0) { endIdx = i + 1; break; }
        } else if (!started && rest[i] === ';' && !isInterface) {
          // type alias without braces: type X = Y;
          endIdx = i + 1; break;
        }
      }

      const definition = rest.slice(0, endIdx).trim();
      const relPath = relative(process.cwd(), file).replace(/\\/g, '/');

      return { name: typeName, definedIn: relPath, line, definition };
    } catch { /* skip */ }
  }

  return null;
}

// ============================================================
// 提取组件文件中的 Props 类型引用
// ============================================================

function processComponent(filePath, allProjectFiles) {
  const relPath = relative(process.cwd(), filePath).replace(/\\/g, '/');
  let source;
  try { source = readFileSync(filePath, 'utf-8'); } catch { return null; }

  // 找 Props interface/type
  let block = null;
  for (const re of [
    /interface\s+(\w*Props)\s*(?:extends\s+[^{]+)?\s*(\{[\s\S]*?\n\})/,
    /type\s+(\w*Props)\s*=\s*(\{[\s\S]*?\n\});/,
  ]) {
    const m = source.match(re);
    if (m) { block = m[2]; break; }
  }

  if (!block) {
    const m = source.match(/(?:React\.)?FC<(\w*Props)>/);
    if (m) {
      const td = source.match(new RegExp(`(?:interface|type)\\s+${m[1]}\\s*(?:=\\s*)?(\\{[\\s\\S]*?\\n\\})`));
      if (td) block = td[1];
    }
  }

  if (!block) {
    // 没有明确的 Props 类型 → 检查 import 的类型
    const importedTypes = [];
    const importRe = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    let im;
    while ((im = importRe.exec(source)) !== null) {
      const names = im[1].split(',').map(s => s.trim()).filter(s => /^[A-Z]/.test(s));
      for (const name of names) {
        if (!importedTypes.find(t => t.name === name)) {
          importedTypes.push({ name, importPath: im[2] });
        }
      }
    }

    // 查找这些导入类型的定义
    const refTypes = [];
    for (const it of importedTypes) {
      const def = findTypeDefinition(it.name, allProjectFiles);
      if (def) refTypes.push(def);
    }

    const name = basename(filePath, extname(filePath));
    return {
      componentName: name,
      file: relPath,
      referencedTypes: refTypes,
      source: 'imports-only',
    };
  }

  // 从 Props block 中提取属性类型
  const lines = block.split('\n');
  const allTypeNames = new Set();

  for (const line of lines) {
    const m = line.trim().match(/^\w+\??:\s*(.+?);?\s*$/);
    if (m) {
      const typeNames = extractTypeNames(m[1]);
      for (const tn of typeNames) allTypeNames.add(tn);
    }
  }

  // 查找每个类型的定义
  const refTypes = [];
  for (const typeName of allTypeNames) {
    const def = findTypeDefinition(typeName, allProjectFiles);
    if (def) refTypes.push(def);
  }

  // 提取组件名
  const name = basename(filePath, extname(filePath));
  let cm = source.match(/export\s+default\s+function\s+(\w+)/);
  if (!cm) cm = source.match(/export\s+default\s+memo\s*\(\s*(\w+)/);
  if (!cm) cm = source.match(/export\s+default\s+(\w+)/);
  if (cm && !['function', 'memo', 'forwardRef'].includes(cm[1])) {
    // name = cm[1];
    // Actually let me not overwrite the filename-based name for consistency
  }

  return {
    componentName: name,
    file: relPath,
    referencedTypes: refTypes,
    source: 'props-interface',
  };
}

// ============================================================
// 主流程
// ============================================================

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.filePaths.length === 0) {
    console.error('Usage: node extract-types.mjs <file1> [file2 ...] --project-root <dir>');
    process.exit(1);
  }

  console.error(`Scanning project files in ${opts.projectRoot}...`);
  const allProjectFiles = walkDir(opts.projectRoot);
  console.error(`Found ${allProjectFiles.length} source files`);

  const results = [];

  for (let i = 0; i < opts.filePaths.length; i++) {
    const fp = opts.filePaths[i];
    console.error(`[${i + 1}/${opts.filePaths.length}] ${fp}`);
    const result = processComponent(fp, allProjectFiles);
    if (result) results.push(result);
  }

  const json = JSON.stringify(results, null, 2);

  if (opts.outputPath) {
    const outDir = dirname(opts.outputPath);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(opts.outputPath, json, 'utf-8');
    console.error(`Saved: ${opts.outputPath}`);
  }

  console.log(json);
}

main();
