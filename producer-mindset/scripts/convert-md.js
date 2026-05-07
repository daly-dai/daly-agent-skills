/**
 * producer-mindset 报告导出工具（零依赖）
 *
 * 用法: node convert-md.js <input.md>
 *
 * 原理:
 *   1. npx marked 将 Markdown → HTML（按需下载到全局缓存，不在本目录留 node_modules）
 *   2. 包裹移动端友好的 CSS 样式
 *   3. 用系统 Edge 浏览器打开，Ctrl+P 即可另存为 PDF
 *
 * 依赖: 仅需 Node.js（已安装）+ 系统 Edge（Windows 自带）
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── 工具函数 ──────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractTitle(markdown) {
  const match = markdown.match(/^##?\s+(.+)$/m);
  return match ? match[1].trim() : '商业分析报告';
}

// ─── HTML 模板（移动端友好） ──────────────────────────────
function wrapHtml(bodyHtml, title) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    font-size: 14px; line-height: 1.8; color: #1a1a1a;
    background: #fff; padding: 20px 16px; max-width: 700px; margin: 0 auto;
  }
  h1 { font-size: 22px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #2563eb; color: #111; }
  h2 { font-size: 18px; margin: 20px 0 10px; color: #1e40af; }
  h3 { font-size: 15px; margin: 16px 0 8px; color: #333; }
  p { margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; word-break: break-all; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; font-weight: 700; color: #374151; white-space: nowrap; }
  tr:nth-child(even) td { background: #fafafa; }
  ul, ol { padding-left: 20px; margin: 8px 0; }
  li { margin: 4px 0; }
  code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-family: Consolas, monospace; font-size: 12px; color: #be123c; }
  pre { background: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 10px 0; font-size: 11px; line-height: 1.6; }
  pre code { background: transparent; color: inherit; padding: 0; font-size: inherit; }
  blockquote { border-left: 3px solid #2563eb; padding: 6px 12px; margin: 10px 0; background: #f8fafc; color: #475569; font-style: italic; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
  strong { color: #111; }
  @media print { h1, h2 { page-break-after: avoid; } table { page-break-inside: avoid; } }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

// ─── 来源标注着色 ──────────────────────────────────────────
function colorTags(bodyHtml) {
  return bodyHtml
    .replace(/\[搜索\]/g, '<span style="color:#2563eb;font-weight:600">[搜索]</span>')
    .replace(/\[推测\]/g, '<span style="color:#d97706;font-weight:600">[推测]</span>')
    .replace(/\[通用\]/g, '<span style="color:#6b7280;font-weight:600">[通用]</span>')
    .replace(/\[通用-需本地验证\]/g, '<span style="color:#6b7280;font-weight:600">[通用-需本地验证]</span>')
    .replace(/\[本地验证\]/g, '<span style="color:#059669;font-weight:600">[本地验证]</span>')
    .replace(/\[本地验证-推翻搜索\]/g, '<span style="color:#059669;font-weight:600">[本地验证-推翻搜索]</span>')
    .replace(/\[未搜到数据\]/g, '<span style="color:#d97706;font-weight:600">[未搜到数据]</span>')
    .replace(/\[全国均值-需本地验证\]/g, '<span style="color:#6b7280;font-weight:600">[全国均值-需本地验证]</span>');
}

// ─── 主流程 ────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
用法: node convert-md.js <报告.md>

流程:
  1. npx marked 将 Markdown 转为 HTML（首次运行会自动下载 marked 到全局缓存）
  2. 包裹移动端友好的样式
  3. 在 Edge 浏览器中打开
  4. 你按 Ctrl+P → 另存为 PDF，即可分享

示例:
  node convert-md.js 奶茶店-分析报告.md
    `);
    process.exit(0);
  }

  const mdPath = path.resolve(args[0]);
  if (!fs.existsSync(mdPath)) {
    console.error(`错误: 文件不存在 — ${mdPath}`);
    process.exit(1);
  }

  // 1. 读取 Markdown
  console.log(`[1/3] 读取: ${mdPath}`);
  const markdown = fs.readFileSync(mdPath, 'utf-8');
  const title = extractTitle(markdown);

  // 2. npx marked 转换
  console.log(`[2/3] Markdown → HTML`);
  const rawHtml = execSync(
    `npx --yes marked -i "${mdPath}"`,
    { encoding: 'utf-8', timeout: 30000 }
  );

  // 3. 包裹模板 + 着色
  console.log(`[3/3] 包裹样式，打开 Edge`);
  const coloredHtml = colorTags(rawHtml);
  const fullHtml = wrapHtml(coloredHtml, title);

  const htmlPath = mdPath.replace(/\.md$/i, '.html');
  fs.writeFileSync(htmlPath, fullHtml, 'utf-8');

  console.log(`\nHTML 已生成: ${htmlPath}`);

  // 4. 用 Edge 打开
  try {
    execSync(`start msedge "${htmlPath}"`, { timeout: 5000 });
  } catch {
    // fallback: 用默认浏览器打开
    try {
      execSync(`start "" "${htmlPath}"`, { timeout: 5000 });
    } catch {
      console.log('请手动用浏览器打开上述 HTML 文件');
    }
  }

  console.log(`
──────────────────────────────────────
  在 Edge 中按 Ctrl+P → 另存为 PDF
  手机端阅读友好，可直接微信发送
──────────────────────────────────────
  `);
}

main().catch((err) => {
  console.error('转换失败:', err.message);
  process.exit(1);
});
