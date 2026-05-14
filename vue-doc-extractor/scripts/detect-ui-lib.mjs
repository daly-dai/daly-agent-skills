#!/usr/bin/env node
// 用法: node detect-ui-lib.mjs <project-root>
// 输出: 空格分隔的库标识列表，如 "antd" / "element" / "antd element" / "unknown"
// 说明: 检测目标项目 package.json 中的 UI 组件库依赖

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.argv[2] || '.';
const pkgPath = join(projectRoot, 'package.json');

let result = [];

try {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps['ant-design-vue']) result.push('antd');
  if (deps['element-plus']) result.push('element');
} catch {
  // package.json 不存在或解析失败
}

console.log(result.length ? result.join(' ') : 'unknown');
