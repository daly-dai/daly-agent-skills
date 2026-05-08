#!/usr/bin/env node
/**
 * 从组件文件中提取 Props 类型定义（批量模式）。
 *
 * 自动尝试多种策略调用 react-docgen，解析输出为结构化 JSON。
 * 所有策略都失败时，回退到手工解析 TypeScript 源码。
 * 每个组件的处理完全隔离，一个报错不影响其他。
 *
 * 用法:
 *   node extract-props.mjs <file1> [file2 ...] --project-root <dir>
 *   node extract-props.mjs src/components/UserTable.tsx src/components/Modal.tsx
 *
 * 输出 (JSON 数组):
 *   [
 *     { "componentName": "UserTable", "success": true, "method": "...", "props": [...], "warnings": [] },
 *     ...
 *   ]
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, join, basename, extname } from 'path';

// ============================================================
// 参数解析
// ============================================================

function parseArgs(argv) {
  const opts = { filePaths: [], projectRoot: process.cwd() };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--project-root' && argv[i + 1]) {
      opts.projectRoot = resolve(argv[++i]);
    } else if (!argv[i].startsWith('--')) {
      opts.filePaths.push(resolve(argv[i]));
    }
  }

  return opts;
}

// ============================================================
// 策略 1-3: 通过 CLI 调用 react-docgen
// ============================================================

function tryCliStrategies(filePath, projectRoot) {
  const strategies = [
    {
      label: 'pnpm exec',
      getCmd: () => `pnpm exec react-docgen --resolver ts "${filePath}"`,
    },
    {
      label: 'npx',
      getCmd: () => `npx react-docgen --resolver ts "${filePath}"`,
    },
  ];

  // 前两种策略
  for (const s of strategies) {
    try {
      const result = execSync(s.getCmd(), {
        encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
        cwd: projectRoot, timeout: 15000,
      });
      if (result.trim()) return { success: true, output: result, method: s.label };
    } catch { /* 继续下一个 */ }
  }

  // 策略 3: 直接调 node_modules 中的 bin
  const binPaths = [
    join(projectRoot, 'node_modules', '.bin', 'react-docgen'),
    join(projectRoot, 'node_modules', 'react-docgen', 'bin', 'react-docgen.js'),
    join(projectRoot, 'node_modules', 'react-docgen', 'dist', 'cli.js'),
  ];
  for (const binPath of binPaths) {
    try {
      const result = execSync(
        `node "${binPath}" --resolver ts "${filePath}"`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], cwd: projectRoot, timeout: 15000 }
      );
      if (result.trim()) return { success: true, output: result, method: `node ${binPath}` };
    } catch { /* 继续 */ }
  }

  return { success: false };
}

// ============================================================
// 解析 react-docgen 输出 (markdown → JSON)
// ============================================================

function parseDocgenOutput(output) {
  const props = [];
  const warnings = [];

  // 表格格式 (新版 react-docgen)
  const tableHeader = output.match(/\| *Name *\|.*\n\|[-\s|]*\n/);
  if (tableHeader) {
    const after = output.slice(tableHeader.index + tableHeader[0].length);
    const end = after.indexOf('\n\n');
    const tableContent = end === -1 ? after : after.slice(0, end);
    const rows = tableContent.trim().split('\n').filter(l => l.includes('|'));

    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 2) continue;
      props.push({
        name: cells[0] || 'unknown',
        type: (cells[1] || 'unknown').replace(/\*$/, ''),
        required: (cells[2] || '').toLowerCase() === 'yes',
        defaultValue: cells[3] === '-' || cells[3] === '' ? null : (cells[3] || null),
        description: cells.slice(4).join(' | ') || '',
      });
    }
    if (props.length > 0) return { props, warnings };
  }

  // 列表格式 (旧版 react-docgen)
  const sections = output.split(/^### /m);
  for (const section of sections) {
    if (!section.trim() || section.startsWith('#') || section.startsWith('##')) continue;
    const lines = section.split('\n');
    const name = lines[0].trim();
    const prop = { name, type: 'unknown', required: false, defaultValue: null, description: '' };

    for (const line of lines) {
      const tl = line.trim();
      if (tl.startsWith('Type:')) prop.type = tl.replace(/^Type:\s*`?/, '').replace(/`$/, '').trim();
      else if (tl.startsWith('Required:')) prop.required = tl.toLowerCase().includes('yes');
      else if (tl.startsWith('Default:')) {
        const dv = tl.replace(/^Default:\s*`?/, '').replace(/`$/, '').trim();
        prop.defaultValue = dv === '-' || dv === '' ? null : dv;
      } else if (tl.startsWith('Description:')) prop.description = tl.replace(/^Description:\s*/, '').trim();
    }

    if (prop.name && prop.name !== 'Props') props.push(prop);
  }

  if (props.length === 0) warnings.push('react-docgen succeeded but no props parsed from output');
  return { props, warnings };
}

// ============================================================
// 策略 4: 手工解析 TypeScript 源码 (最后兜底)
// ============================================================

function manualExtractProps(source) {
  const props = [];
  const warnings = ['react-docgen unavailable, using manual extraction'];

  // 查找 Props 接口/类型
  let block = null;

  for (const re of [
    /interface\s+(\w*Props)\s*(?:extends\s+[^{]+)?\s*(\{[\s\S]*?\n\})/,
    /type\s+(\w*Props)\s*=\s*(\{[\s\S]*?\n\});/,
  ]) {
    const m = source.match(re);
    if (m) { block = m[2]; break; }
  }

  // React.FC<Props> 模式
  if (!block) {
    const m = source.match(/(?:React\.)?FC<(\w*Props)>/);
    if (m) {
      const typeDef = source.match(new RegExp(`(?:interface|type)\\s+${m[1]}\\s*(?:=\\s*)?(\\{[\\s\\S]*?\\n\\})`));
      if (typeDef) block = typeDef[1];
    }
  }

  if (!block) {
    warnings.push('No Props interface/type found');
    return { props, warnings };
  }

  const lines = block.split('\n');
  let pendingComment = '';

  for (const line of lines) {
    const tl = line.trim();

    if (tl.startsWith('/**') || tl.startsWith('*')) {
      pendingComment += tl.replace(/^\/?\*+\s*\/?/, '').replace(/^\*\s*/, '').trim() + ' ';
      if (tl.endsWith('*/')) pendingComment = pendingComment.replace(/\s*\*\/\s*$/, '').trim();
      continue;
    }
    if (tl.startsWith('//')) { pendingComment = tl.replace(/^\/\/\s*/, '').trim(); continue; }

    const m = tl.match(/^(\w+)(\?)?:\s*(.+?);?\s*$/);
    if (m) {
      props.push({
        name: m[1], type: m[3].replace(/;$/, '').trim(),
        required: !m[2], defaultValue: null, description: pendingComment || '',
      });
      pendingComment = '';
    }
  }

  if (props.length === 0) warnings.push('Props interface found but no properties parsed');
  return { props, warnings };
}

// ============================================================
// 提取组件名
// ============================================================

function extractComponentName(source, filePath) {
  let m = source.match(/export\s+default\s+function\s+(\w+)/);
  if (m) return m[1];
  m = source.match(/export\s+default\s+memo\s*\(\s*(\w+)/);
  if (m) return m[1];
  m = source.match(/export\s+default\s+(\w+)/);
  if (m && !['function', 'memo', 'forwardRef'].includes(m[1])) return m[1];
  return basename(filePath, extname(filePath));
}

// ============================================================
// 处理单个组件
// ============================================================

function processOne(filePath, projectRoot) {
  let source;
  try {
    source = readFileSync(filePath, 'utf-8');
  } catch {
    return {
      componentName: basename(filePath, extname(filePath)),
      file: filePath,
      success: false,
      method: 'error',
      props: [],
      warnings: [`Cannot read file: ${filePath}`],
    };
  }

  const componentName = extractComponentName(source, filePath);
  const cliResult = tryCliStrategies(filePath, projectRoot);

  if (cliResult.success) {
    const parsed = parseDocgenOutput(cliResult.output);
    return {
      componentName, file: filePath,
      success: true, method: cliResult.method,
      props: parsed.props, warnings: parsed.warnings,
    };
  }

  const manual = manualExtractProps(source);
  return {
    componentName, file: filePath,
    success: false, method: 'manual-extraction',
    props: manual.props, warnings: manual.warnings,
  };
}

// ============================================================
// 主流程
// ============================================================

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.filePaths.length === 0) {
    console.error('Usage: node extract-props.mjs <file1> [file2 ...] --project-root <dir>');
    process.exit(1);
  }

  const { filePaths, projectRoot } = opts;
  const results = [];

  for (let i = 0; i < filePaths.length; i++) {
    const fp = filePaths[i];
    console.error(`[${i + 1}/${filePaths.length}] ${fp}`);
    const result = processOne(fp, projectRoot);
    results.push(result);
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
