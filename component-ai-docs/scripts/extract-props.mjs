#!/usr/bin/env node
/**
 * 从组件文件中提取 Props 类型定义（批量模式）。
 *
 * 优先使用 react-docgen-typescript (TypeScript Compiler API)，
 * 不可用时回退到手工解析 TypeScript 源码。
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

import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { resolve, join, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

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
// react-docgen-typescript API
// ============================================================

let _docgen = null;
let _docgenError = null;

function tryReactDocgenTypescript(filePath, projectRoot) {
  if (_docgen === null && _docgenError === null) {
    try {
      const pkgJsonPath = join(projectRoot, 'package.json');
      const require_ = createRequire(pkgJsonPath);
      _docgen = require_('react-docgen-typescript');
    } catch (err) {
      _docgenError = err.message;
      return null;
    }
  }
  if (!_docgen) return null;

  const tsconfigPath = join(projectRoot, 'tsconfig.json');
  let result;
  try {
    const parser = _docgen.withCustomConfig(tsconfigPath, {
      propFilter: (prop) => {
        if (prop.parent?.fileName?.includes('node_modules')) return false;
        return true;
      },
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
    });
    result = parser.parse(filePath);
  } catch (err) {
    _docgenError = err.message;
    return null;
  }

  if (!result || result.length === 0) return null;
  return result[0];
}

function stringifyType(type) {
  if (!type) return 'unknown';
  if (type.name === 'union') {
    return (type.value || []).map(v => ('value' in v ? v.value : v.name)).join(' | ');
  }
  if (type.name === 'enum') {
    if (Array.isArray(type.value)) return type.value.map(v => v.value).join(' | ');
    return type.value || 'enum';
  }
  if (type.name === 'array') return `${stringifyType(type.value)}[]`;
  if (type.name === 'signature' || type.type === 'object') {
    const props = (type.signature?.properties || []).map(p => `${p.key}: ${stringifyType(p.value)}`).join(', ');
    return `{ ${props} }`;
  }
  if (type.name === 'intersection') {
    return (type.value || []).map(v => stringifyType(v)).join(' & ');
  }
  return type.name || 'unknown';
}

function convertDocgenResult(docgenResult) {
  const props = [];
  for (const [propName, info] of Object.entries(docgenResult.props || {})) {
    props.push({
      name: propName,
      type: stringifyType(info.type),
      required: info.required || false,
      defaultValue: info.defaultValue?.value || null,
      description: info.description || '',
    });
  }
  return props;
}

// ============================================================
// 手工解析 TypeScript 源码 (兜底)
// ============================================================

function manualExtractProps(source) {
  const props = [];
  const warnings = ['react-docgen-typescript unavailable, using manual extraction'];

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
  let depth = 0;
  let currentProp = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed || trimmed === '{' || trimmed === '}') continue;

    if (trimmed.startsWith('/**') || trimmed.startsWith('*')) {
      pendingComment += trimmed.replace(/^\/?\*+\s*\/?/, '').replace(/^\*\s*/, '').trim() + ' ';
      if (trimmed.endsWith('*/')) pendingComment = pendingComment.replace(/\s*\*\/\s*$/, '').trim();
      continue;
    }
    if (trimmed.startsWith('//')) { pendingComment = trimmed.replace(/^\/\/\s*/, '').trim(); continue; }

    currentProp += (currentProp ? ' ' : '') + trimmed;

    depth += (trimmed.match(/[{(<[]/g) || []).length;
    depth -= (trimmed.match(/[}>)\]]/g) || []).length;

    if (depth <= 0) {
      const propMatch = currentProp.match(
        /^(?:readonly\s+)?(\w+)(\??):\s*(.+?);?\s*$/
      );
      if (propMatch && !propMatch[1].startsWith('[')) {
        props.push({
          name: propMatch[1],
          type: propMatch[3].replace(/;?\s*$/, '').trim(),
          required: !propMatch[2],
          defaultValue: null,
          description: pendingComment || '',
        });
      }
      pendingComment = '';
      currentProp = '';
      depth = 0;
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
  const name = basename(filePath, extname(filePath));
  if (name === 'index') return basename(dirname(filePath));
  return name;
}

// ============================================================
// 处理单个组件
// ============================================================

export function processOne(filePath, projectRoot) {
  let source;
  try {
    source = readFileSync(filePath, 'utf-8');
  } catch {
    const fallbackName = basename(filePath, extname(filePath));
    return {
      componentName: fallbackName === 'index' ? basename(dirname(filePath)) : fallbackName,
      file: filePath,
      success: false,
      method: 'error',
      props: [],
      sourceHash: null,
      warnings: [`Cannot read file: ${filePath}`],
    };
  }

  const componentName = extractComponentName(source, filePath);
  const sourceHash = createHash('sha256').update(source).digest('hex');

  const docgenResult = tryReactDocgenTypescript(filePath, projectRoot);
  if (docgenResult) {
    return {
      componentName, file: filePath,
      success: true, method: 'react-docgen-typescript',
      props: convertDocgenResult(docgenResult),
      warnings: [],
      sourceHash,
    };
  }

  const manual = manualExtractProps(source);
  return {
    componentName, file: filePath,
    success: false, method: 'manual-extraction',
    props: manual.props, warnings: manual.warnings,
    sourceHash,
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
    results.push(processOne(fp, projectRoot));
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

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) main();
