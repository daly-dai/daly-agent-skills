# Component AI Docs V2 — AST 改造详细方案

## 零、先回答打包问题

**不需要打包。** 不需要 `npm install`、不需要 `package.json`、不需要发布 npm 包。

脚本通过 `createRequire` 从**目标项目**（被分析的项目）的 `node_modules` 加载 `typescript`，就像现有 `extract-props.mjs` 加载 `react-docgen-typescript` 一样：

```js
// extract-props.mjs:54-56 (现有模式，直接复用)
const pkgJsonPath = join(projectRoot, 'package.json');
const require_ = createRequire(pkgJsonPath);
const ts = require_('typescript');
```

**前提条件**：目标项目的 `devDependencies` 里有 `typescript`（有 `tsconfig.json` 的项目几乎必然有）。如果没有，脚本启动时检测到 `typescript` 不可用，降级到正则 fallback 模式。

**使用方式不变**：AI 仍然通过 `node <skill-dir>/scripts/scan-components.mjs <项目根目录>` 调用，和现在完全一样。

---

## 一、改造范围

| 文件 | 改动 | 说明 |
|------|------|------|
| `scripts/scan-components.mjs` | **重写** | AST 提取 + 引用计数 + 桶检测，替代全部正则 |
| `scripts/collect-usages.mjs` | **重写** | AST 采集 JSX 使用，精确归属 |
| `scripts/prepare.mjs` | **微调** | 缓存命名改用 id |
| `scripts/extract-props.mjs` | **不动** | 已用 react-docgen-typescript |
| `scripts/extract-types.mjs` | **不动** | 类型提取逻辑不变 |
| `references/output-format.md` | **不动** | 模板不变 |
| `references/jsdoc-guidelines.md` | **不动** | 规范不变 |
| `references/flowchart.md` | **微调** | 路径引用更新 |
| `SKILL.md` | **微调** | 路径引用从 `<组件名>` 改为 `<组件id>` |

---

## 二、scan-components.mjs 重写方案

### 2.1 整体流程

```
输入: 项目根目录 (--project-root)、可选 --dir / --patterns / --output
输出: .ai/project-components/.component-list.json

流程:
  parseArgs → loadTypeScript → createProgram → extractComponents → resolveBarrelImports
  → countReferences → assignPriorities → generateIds → writeOutput
```

### 2.2 loadTypeScript（新增）

```js
function loadTypeScript(projectRoot) {
  const pkgJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(pkgJsonPath)) return { ts: null, reason: '无 package.json' };
  try {
    const require_ = createRequire(pkgJsonPath);
    const ts = require_('typescript');
    return { ts, require_ };
  } catch {
    return { ts: null, reason: 'typescript 未安装（devDependencies 中无 typescript）' };
  }
}

// 不可用时输出: "typescript not found, falling back to regex mode"
// 退出码 0，在 stdout JSON 中标记 "method": "regex-fallback"
```

### 2.3 createProgram（新增）

```js
function loadProject(ts, projectRoot, opts) {
  const tsconfigPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, 'tsconfig.json');
  if (!tsconfigPath) throw new Error('找不到 tsconfig.json');

  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config, ts.sys, dirname(tsconfigPath), {}, tsconfigPath
  );

  // 如果用户指定了 --dir，只取该目录下的文件
  let fileNames = parsedConfig.fileNames;
  if (opts.dir) {
    const dirAbs = resolve(projectRoot, opts.dir);
    fileNames = fileNames.filter(f => f.startsWith(dirAbs));
  }
  // 如果用户指定了 --patterns，用 glob 过滤
  if (opts.patterns) {
    const regexes = opts.patterns.map(p => globToRegex(p));
    fileNames = fileNames.filter(f => {
      const rel = relative(projectRoot, f).replace(/\\/g, '/');
      return regexes.some(re => re.test(rel));
    });
  }

  return ts.createProgram(fileNames, parsedConfig.options);
}
```

### 2.4 extractComponents（新增，替代原有的 extractComponents 函数）

```js
function extractComponents(ts, program, projectRoot) {
  const components = [];       // { name, file, isDefault, barrelExportPaths }
  const barrelMap = new Map(); // barrelFilePath → [{ name, from }]

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;  // 跳过 .d.ts

    const filePath = sourceFile.fileName;

    // 跳过 node_modules
    if (filePath.includes('node_modules')) continue;

    const relPath = relative(projectRoot, filePath).replace(/\\/g, '/');

    // 跳过排除目录
    if (EXCLUDE_DIRS_SOME.some(d => relPath.startsWith(d + '/'))) continue;

    ts.forEachChild(sourceFile, node => {
      // --- 1) export default function Button / export default function Button<T>
      if (ts.isFunctionDeclaration(node) && node.name) {
        if (hasDefaultExportModifier(node)) {
          addComponent(components, node.name.text, relPath, true);
        }
        return;
      }

      // --- 2) export default const Button = ... (变量声明)
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && isPascalCase(decl.name.text)) {
            if (hasExportModifier(node) || hasDefaultExportModifier(node)) {
              const isDefault = hasDefaultExportModifier(node);
              addComponent(components, decl.name.text, relPath, isDefault);
            }
          }
        }
        return;
      }

      // --- 3) export default class Button
      if (ts.isClassDeclaration(node) && node.name) {
        if (hasDefaultExportModifier(node) || hasExportModifier(node)) {
          addComponent(components, node.name.text, relPath, hasDefaultExportModifier(node));
        }
        return;
      }

      // --- 4) export { Button } from './Button' (桶文件)
      if (ts.isExportDeclaration(node) && node.exportClause && node.moduleSpecifier) {
        if (ts.isNamedExports(node.exportClause)) {
          const barrelExports = [];
          for (const el of node.exportClause.elements) {
            const exportedName = el.name.text;
            barrelExports.push({ name: exportedName, from: node.moduleSpecifier.text });
          }
          if (barrelExports.length > 0) {
            barrelMap.set(relPath, barrelExports);
          }
        }
        return;
      }

      // --- 5) export { Button } (无 from，重导出本文件定义的变量)
      if (ts.isExportDeclaration(node) && node.exportClause && !node.moduleSpecifier) {
        if (ts.isNamedExports(node.exportClause)) {
          for (const el of node.exportClause.elements) {
            addComponent(components, el.name.text, relPath, false);
          }
        }
        return;
      }
    });
  }

  // --- 关联桶文件 ---
  // 对每个桶文件的导出，找到同目录下的真实组件文件
  for (const [barrelPath, exports] of barrelMap) {
    const barrelDir = dirname(barrelPath);
    for (const exp of exports) {
      // 在同目录下找名为 exp.name 的组件
      const target = components.find(
        c => c.name === exp.name && dirname(c.file) === barrelDir
      );
      if (target) {
        if (!target.barrelExportPaths) target.barrelExportPaths = [];
        target.barrelExportPaths.push(barrelPath);
      }
    }
  }

  // --- fallback: 没有导出声明的文件，用文件名 ---
  const hashed = new Set(components.map(c => c.file));
  for (const sourceFile of program.getSourceFiles()) {
    const filePath = sourceFile.fileName;
    if (filePath.includes('node_modules')) continue;
    const relPath = relative(projectRoot, filePath).replace(/\\/g, '/');
    const ext = extname(filePath).toLowerCase();
    if (ext !== '.tsx') continue;

    if (!hashed.has(relPath)) {
      const name = basename(filePath, ext);
      if (name !== 'index') {
        addComponent(components, name, relPath, false);
        hashed.add(relPath);
      }
    }
  }

  return { components, barrelMap };
}
```

### 2.5 countReferences（新增，替代原有的 countReferences）

```js
function countReferences(ts, program, components, projectRoot) {
  // 构建查找表：filePath → component
  const fileToComponent = new Map();
  for (const c of components) {
    const absPath = resolve(projectRoot, c.file);
    fileToComponent.set(normalizePath(absPath), c);
  }

  // 桶文件解析表：barrelFilePath → 目标组件文件
  const barrelToTarget = new Map();
  for (const c of components) {
    for (const bp of c.barrelExportPaths || []) {
      barrelToTarget.set(normalizePath(resolve(projectRoot, bp)), c);
    }
  }

  // 每个组件的引用计数器
  const refs = new Map(); // component → Set<importingFile>

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    const importingFile = normalizePath(sourceFile.fileName);
    if (importingFile.includes('node_modules')) continue;

    ts.forEachChild(sourceFile, node => {
      if (!ts.isImportDeclaration(node)) return;
      if (!node.importClause?.namedBindings) return;
      if (!ts.isNamedImports(node.importClause.namedBindings)) return;

      const specifier = node.moduleSpecifier.text;

      // 三方 detect：bare specifier
      if (isBareSpecifier(specifier)) return;

      // 用 TypeScript 模块解析
      const resolved = ts.resolveModuleName(
        specifier,
        sourceFile.fileName,
        program.getCompilerOptions(),
        ts.sys
      );

      if (!resolved.resolvedModule?.resolvedFileName) return;
      const targetFile = normalizePath(resolved.resolvedModule.resolvedFileName);

      // 检查是否引用了我们的组件
      let targetComponent = fileToComponent.get(targetFile);
      if (!targetComponent) {
        targetComponent = barrelToTarget.get(targetFile);
      }
      if (!targetComponent) return;

      // 检查引入的组件名是否匹配
      for (const el of node.importClause.namedBindings.elements) {
        if (el.name.text === targetComponent.name) {
          // 记录引用
          if (!refs.has(targetComponent)) refs.set(targetComponent, new Set());
          refs.get(targetComponent).add(importingFile);
        }
      }
    });
  }

  // 写入 refs
  for (const c of components) {
    c.refs = refs.has(c) ? refs.get(c).size : 0;
  }
}

function isBareSpecifier(specifier) {
  // 不以 . / @/ 开头的都是 bare specifier → 来自 node_modules
  return !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('@/');
}

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}
```

### 2.6 辅助函数

```js
function hasDefaultExportModifier(node) {
  if (!node.modifiers) return false;
  return node.modifiers.some(
    m => m.kind === ts.SyntaxKind.DefaultKeyword || m.kind === ts.SyntaxKind.ExportKeyword
  );
}

// 注意：ts.isFunctionDeclaration 返回的 node，其 modifiers 可能同时包含 Export 和 Default
// 需要判断组合：
// - export default function → modifiers: [ExportKeyword, DefaultKeyword]
// - export function → modifiers: [ExportKeyword]
// 我们用 hasExportModifier 判断 export，hasDefaultExportModifier 判断 default

function hasExportModifier(node) {
  if (!node.modifiers) return false;
  return node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
}

function isDefaultExport(node) {
  if (!node.modifiers) return false;
  return node.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
}

function isPascalCase(name) {
  return /^[A-Z]/.test(name);
}

function addComponent(list, name, file, isDefault) {
  // 避免重复（同一个文件里同一个名字）
  const exists = list.find(c => c.name === name && c.file === file);
  if (exists) {
    // 如果原来是 false，现在是 true，提升
    if (isDefault) exists.isDefault = true;
    return;
  }
  list.push({ name, file, isDefault, refs: 0, barrelExportPaths: [] });
}

function generateId(name, filePath) {
  const sanitized = filePath
    .replace(/[\/\\]/g, '-')
    .replace(/\.(tsx|ts|jsx|js|mjs|cjs)$/i, '')
    .replace(/[^a-zA-Z0-9一-鿿_-]/g, '');  // 安全字符
  return `${name}__${sanitized}`;
}
```

### 2.7 主流程（main）

```js
function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { projectRoot } = opts;

  // 1. 加载 TypeScript（可选，失败则降级正则）
  const { ts } = loadTypeScript(projectRoot);
  if (!ts) {
    console.error('TypeScript not available, falling back to regex mode.');
    // 调用原有的纯正则流程（保留为 fallback 函数）
    return regexFallbackMain(opts);
  }

  // 2. 创建 Program
  const program = createProgram(ts, projectRoot, opts);
  const sourceFiles = program.getSourceFiles();
  const tsxFiles = sourceFiles.filter(
    f => !f.isDeclarationFile && f.fileName.endsWith('.tsx')
  );
  console.error(`Analyzing ${tsxFiles.length} .tsx files...`);

  // 3. 提取组件
  const { components } = extractComponents(ts, program, projectRoot);
  console.error(`Found ${components.length} components`);

  // 4. 引用计数
  countReferences(ts, program, components, projectRoot);

  // 5. 优先级
  assignPriorities(components);

  // 6. 生成 id
  for (const c of components) c.id = generateId(c.name, c.file);

  // 7. 分组排序
  const grouped = groupAndSort(components);

  // 8. 输出
  writeOutput(grouped, opts, projectRoot);
}
```

### 2.8 降级策略

```js
function loadTypeScript(projectRoot) {
  try {
    const pkgJson = join(projectRoot, 'package.json');
    const require_ = createRequire(pkgJson);
    return { ts: require_('typescript'), require_ };
  } catch {
    return { ts: null, reason: 'typescript not in project devDependencies' };
  }
}

// 主入口：
const { ts, reason } = loadTypeScript(opts.projectRoot);
if (!ts) {
  console.error(`[warn] ${reason} — 降级为 AI 通读源码模式。`);
  console.error(`[warn] 请使用 /component-ai-docs-fallback 或等待非 TS 环境专用版。`);
  // 输出 JSON 中标记
  console.log(JSON.stringify({ method: 'unavailable', reason }));
  process.exit(0);
}
```

降级不自动切正则——因为正则版的精度问题正是我们这次要解决的。降级时直接告知不可用，让用户走未来的非 TS 版。

---

## 三、collect-usages.mjs 重写方案

### 3.1 整体流程

```
输入: 组件名列表 + --project-root
输出: 每个组件的 JSX 使用示例（含文件路径、行号、代码片段）

流程:
  loadTypeScript → createProgram → typeChecker
  → 遍历所有 JSX 节点 → 用 typeChecker.getSymbolAtLocation 定位声明
  → 声明文件 ∈ componentMap → 收集
  → 声明文件在 node_modules → 跳过
  → 输出 JSON
```

### 3.2 核心逻辑

```js
function collectUsages(ts, program, componentNames, projectRoot) {
  const typeChecker = program.getTypeChecker();
  const results = new Map(); // componentName → usages[]

  for (const name of componentNames) {
    results.set(name, []);
  }

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    if (sourceFile.fileName.includes('node_modules')) continue;

    // 遍历 JSX 节点
    visitJsxNodes(ts, sourceFile, node => {
      const tagName = getJsxTagName(node); // 'Button' or 'antd.Button'
      if (!tagName || !componentNames.includes(tagName)) return;

      // 用 TypeChecker 定位符号
      const symbol = typeChecker.getSymbolAtLocation(node.tagName);
      if (!symbol?.declarations?.length) return;

      const declFileName = normalizePath(symbol.declarations[0].getSourceFile().fileName);

      // 三方跳过
      if (declFileName.includes('node_modules')) return;

      // 项目内使用 — 收集
      const fileRel = relative(projectRoot, sourceFile.fileName).replace(/\\/g, '/');
      const lineNum = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

      // 提取代码块 (±4 行)
      const codeBlock = extractCodeBlock(sourceFile, lineNum);

      results.get(tagName).push({
        file: fileRel,
        line: lineNum,
        codeBlock,
      });
    });
  }

  return results;
}
```

### 3.3 typeChecker 的威力

```
场景: 一个文件同时有:
  import { Button } from 'antd';
  import { Button as MyButton } from '@/components';

  <Button>提交</Button>         ← typeChecker → antd 的 Button
  <MyButton>提交</MyButton>    ← typeChecker → 项目组件
  <Button>取消</Button>         ← typeChecker → antd 的 Button

正则版: 三个都当项目组件使用 → 2/3 错误
AST 版: 只收 MyButton → 100% 正确
```

---

## 四、prepare.mjs 改动（微调）

只改两处：

```diff
// 1. 新增 generateId
+ function generateId(name, relPath) {
+   const sanitized = relPath.replace(/[\/\\]/g, '-').replace(/\.(tsx|ts|jsx|js|mjs|cjs)$/i, '');
+   return `${name}__${sanitized}`;
+ }

// 2. 缓存文件命名
- const outPath = join(outputDir, `${componentName}.json`);
+ const relPath = relative(projectRoot, fp).replace(/\\/g, '/');
+ const id = generateId(componentName, relPath);
+ const outPath = join(outputDir, `${id}.json`);

// 3. merged 对象加 id
  const merged = {
    componentName,
+   id,
    sourceHash: propsResult.sourceHash,
    ...
  };
```

---

## 五、SKILL.md + flowchart.md 改动

全局替换规则：**路径中的 `<组件名>` → `<组件id>`**

具体位置已在上一版方案中列出，此处不重复。

---

## 六、使用方式（不变）

```
# AI 触发 skill 后，仍然是：
node <skill-dir>/scripts/scan-components.mjs <项目根目录>

# 示例：
node E:/work-space/daly-agent-skills/component-ai-docs/scripts/scan-components.mjs /home/user/my-react-project

# 可选参数不变：
--dir <path>        只扫描指定子目录
--patterns <p1,p2>  自定义 glob 模式
--output <path>     自定义输出路径
```

**唯一新增的前提条件**：目标项目的 `devDependencies` 里必须有 `typescript`。没有的话脚本输出 `method: 'unavailable'` + 错误原因，不会静默失败。

---

## 七、产出文件结构（不变）

```
.ai/project-components/
├── .component-list.json          # 组件清单（加了 id 和 barrelExportPaths 字段）
├── .cache/                       # 组件级缓存
│   ├── Button__src-components-Button.json    # 文件名用 id
│   └── Button__src-business-Button.json
├── components/                   # 文档
│   ├── Button__src-components-Button/
│   │   ├── index.md
│   │   └── metadata.json
│   └── Button__src-business-Button/
│       ├── index.md
│       └── metadata.json
└── README.md
```

---

## 八、改造清单

| 序号 | 内容 | 文件 | 工作量 |
|------|------|------|--------|
| 1 | 扫描脚本 AST 重写 | `scripts/scan-components.mjs` | ~1.5h |
| 2 | 使用采集 AST 重写 | `scripts/collect-usages.mjs` | ~1h |
| 3 | prepare 微调（id 命名） | `scripts/prepare.mjs` | ~15min |
| 4 | 流程图路径更新 | `references/flowchart.md` | ~10min |
| 5 | SKILL.md 路径更新（组件名→id） | `SKILL.md` | ~15min |
| 6 | 构造测试用例验证 | 临时测试项目 | ~30min |

总计约 3.5 小时。
