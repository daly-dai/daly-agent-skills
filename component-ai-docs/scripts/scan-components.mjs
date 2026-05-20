#!/usr/bin/env node
/**
 * 扫描项目中的业务组件，输出 .component-list.json
 *
 * 用法:
 *   node scan-components.mjs <project-root> [--dir <subdir>] [--output <path>]
 *
 * 做的事（有边界）：
 *   1. 找到组件文件（PascalCase 命名）
 *   2. 提取同文件内的 interface XxxProps 字段
 *   3. 统计每个组件被 import 的次数
 *   4. 列出 2-3 个使用该组件的文件路径
 *
 * 不做的事：
 *   不解析 AST、不处理桶文件转发、不追踪复杂类型
 *   遇到复杂情况 → 标记 [待确认]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, extname } from 'node:path';

// ============================================================
// 配置
// ============================================================

const SEARCH_PATTERNS = [
  'src/components/**',
  'components/**',
  'src/pages/**/components/**',
  'src/business/**',
  'src/widgets/**',
];

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next',
  'coverage', '__pycache__', '.turbo', 'out', 'public',
]);

// ============================================================
// 参数解析
// ============================================================

function parseArgs(argv) {
  const opts = { projectRoot: process.cwd(), outputPath: null, dir: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir' && argv[i + 1]) opts.dir = argv[++i];
    else if (argv[i] === '--output' && argv[i + 1]) opts.outputPath = resolve(argv[++i]);
    else if (!argv[i].startsWith('--')) opts.projectRoot = resolve(argv[i]);
  }
  return opts;
}

// ============================================================
// 文件发现
// ============================================================

function* walkDir(dir, projectRoot) {
  if (!existsSync(dir)) return;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        yield* walkDir(full, projectRoot);
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if (['.tsx', '.jsx', '.ts', '.js'].includes(ext)) {
          yield { path: full, rel: relative(projectRoot, full).replace(/\\/g, '/') };
        }
      }
    }
  } catch { /* 权限不足，跳过 */ }
}

function isPascalCase(name) {
  return /^[A-Z]/.test(name);
}

function matchPattern(relPath, patterns) {
  for (const pattern of patterns) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$'
    );
    if (regex.test(relPath)) return true;
  }
  return false;
}

// ============================================================
// Props 提取（同文件内 interface XxxProps）
// ============================================================

function extractProps(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    // 匹配 interface XxxProps { ... }
    const ifaceRegex = /interface\s+(\w+Props)\s*\{([^}]+)\}/gs;
    const props = [];
    let match;
    while ((match = ifaceRegex.exec(content)) !== null) {
      const body = match[2];
      // 逐行解析字段
      const fieldLines = body.split('\n');
      for (const line of fieldLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
        // 匹配: fieldName?: type; 或 fieldName: type;
        const fieldMatch = trimmed.match(/^(\w+)(\?)?\s*:\s*(.+?)[;,]\s*$/);
        if (fieldMatch) {
          const [, name, optional, rawType] = fieldMatch;
          const type = rawType.replace(/\/\*.*?\*\//g, '').trim();
          const isComplex = /[<>&|]/.test(type) || type.includes('import(') || type === 'any';
          props.push({
            name,
            optional: !!optional,
            type: isComplex ? `[待确认] ${type}` : type,
            isComplex,
          });
        }
      }
    }
    return props.length ? props : null;
  } catch {
    return null;
  }
}

// ============================================================
// 引用计数 + 使用示例搜索
// ============================================================

function countReferences(componentName, allFiles) {
  const importRegex = new RegExp(
    `import\\s+.*\\b${componentName}\\b.*from\\s+['"]`
  );
  const usageFiles = [];

  for (const file of allFiles) {
    try {
      const content = readFileSync(file.path, 'utf-8');
      if (importRegex.test(content)) {
        usageFiles.push(file.rel);
      }
    } catch { /* skip */ }
  }

  return {
    count: usageFiles.length,
    examples: usageFiles.slice(0, 3), // 最多 3 个使用示例路径
  };
}

// ============================================================
// 生成组件 ID
// ============================================================

function generateId(name, relPath) {
  const sanitized = relPath.replace(/[\/\\]/g, '-').replace(/\.(tsx|ts|jsx|js)$/i, '');
  return `${name}__${sanitized}`;
}

// ============================================================
// 主流程
// ============================================================

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { projectRoot } = opts;

  if (!existsSync(projectRoot)) {
    console.error(`Project root not found: ${projectRoot}`);
    process.exit(1);
  }

  // 1. 收集所有源文件
  const allFiles = [];
  const scanDir = opts.dir ? join(projectRoot, opts.dir) : projectRoot;
  for (const file of walkDir(scanDir, projectRoot)) {
    allFiles.push(file);
  }

  // 2. 筛选组件文件（PascalCase 命名 + 匹配搜索模式）
  const componentFiles = allFiles.filter(f => {
    const baseName = f.rel.split('/').pop().replace(/\.[^.]+$/, '');
    return isPascalCase(baseName) && matchPattern(f.rel, SEARCH_PATTERNS);
  });

  if (componentFiles.length === 0) {
    console.log('No component files matched any pattern');
    process.exit(0);
  }

  // 3. 对每个组件文件提取信息
  const components = [];
  for (const file of componentFiles) {
    const baseName = file.rel.split('/').pop().replace(/\.[^.]+$/, '');
    const props = extractProps(file.path);
    const { count: refCount, examples: usageExamples } = countReferences(baseName, allFiles);

    components.push({
      name: baseName,
      id: generateId(baseName, file.rel),
      file: file.rel,
      props: props || [],
      propsStatus: props ? (props.some(p => p.isComplex) ? 'partial' : 'extracted') : 'not-found',
      referenceCount: refCount,
      usageExamples,
      priority: refCount >= 5 ? 'high' : refCount >= 2 ? 'medium' : 'low',
    });
  }

  // 按引用次数降序
  components.sort((a, b) => b.referenceCount - a.referenceCount);

  // 4. 分类
  const high = components.filter(c => c.priority === 'high');
  const medium = components.filter(c => c.priority === 'medium');
  const low = components.filter(c => c.priority === 'low');

  // 5. 输出
  const output = {
    generatedAt: new Date().toISOString().split('T')[0],
    projectRoot,
    summary: {
      total: components.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
      propsExtracted: components.filter(c => c.propsStatus === 'extracted').length,
      propsPartial: components.filter(c => c.propsStatus === 'partial').length,
      propsNotFound: components.filter(c => c.propsStatus === 'not-found').length,
    },
    components: { high, medium, low },
  };

  const outputPath = opts.outputPath || join(projectRoot, '.ai', 'project-components', '.component-list.json');
  const outDir = dirname(outputPath);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Scanned ${components.length} components → ${outputPath}`);
  console.log(`  high: ${high.length}, medium: ${medium.length}, low: ${low.length}`);
  console.log(`  props: ${output.summary.propsExtracted} extracted, ${output.summary.propsPartial} partial, ${output.summary.propsNotFound} not found`);
}

main();
