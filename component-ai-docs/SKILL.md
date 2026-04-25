---
name: component-ai-docs
description: "解决 AI 无法获取业务组件库/项目组件 API 的问题。两条路线：(A) 为新组件库生成 AI 文档并打包进 npm；(B) 盘活历史项目的存量组件，自动提取类型 + 补全使用边界。触发词：组件文档、AI组件文档、组件库文档、盘活组件、提取组件API、让AI认识组件、component docs for AI、metadata.json。"
---

# Component AI Docs

> 让 AI 认识你的组件——不管它来自 npm 包还是项目里的历史代码。

**核心问题**: AI 写前端代码时，不知道你用的组件长什么样、接受什么 Props、什么时候该用什么时候不该用。

**解决思路**: 不是做一个更聪明的"自动扫描库"，而是建立一套**组件库作者 → AI 可消费文档**的标准格式，和一套**历史组件盘活**的流程。

---

## 路由表

| 用户信号 | 路线 | 说明 |
|---------|------|------|
| 给组件库加 AI 文档、npm 包、发布组件库、`src/components/` + `package.json` 同时存在 | **A: 组件库文档化** | 组件库作者，希望消费者安装后 AI 自动认识 |
| 历史项目、存量组件、旧项目、盘活、`src/components/` 下很多组件但没有文档 | **B: 历史项目盘活** | 接手或维护的老项目，组件散落在项目里 |
| 同步、消费端、已有组件库想同步文档 | **C: 消费端同步** | 项目用了带 AI 文档的组件库，需要自动同步 |

> 模糊时优先选 B（最常见场景），在步骤 1 向用户确认。

---

## 核心原则

1. **组件库作者最了解组件。** `metadata.json` 里的"何时用/何时不用"只有人能写对——Skill 的角色是引导写出来，不是替代判断。
2. **JSDoc 写给人看的不等于写给 AI 看的。** "用户名称"是给人看的，"必填，用于表格列渲染和搜索条件"是给 AI 看的。
3. **先盘核心，再补全量。** 20 个组件里高频使用的可能就 5 个，优先盘活这几个。
4. **输出格式统一。** 不管来自 npm 包还是历史项目，最终产出的 `ai/` 目录结构一致，AI 消费方式一样。

---

## 共享知识：AI 可消费文档的标准格式

> 三条路线最终产出的文档格式都是这个。这是本 Skill 的"输出锁"。

### 目录结构

```
ai/                              # 组件库根目录或 .ai/sdesign/
├── README.md                    # 索引层：组件速查表（用途 + 边界 + 一句话描述）
└── components/
    ├── SSearchTable.md          # 详情层：完整 Props + 组合引用
    ├── SForm.md
    └── ...
```

### README.md 索引层（给 AI 第一步看）

AI 先读这个，快速判断"有没有我能用的组件"，再按需读取具体组件的详情文件。不一次性全读。

### ai/components/{Name}.md 详情层（给 AI 要用时看）

每个文件应包含：

1. **使用边界**（最优先）：何时适用、何时不适用、优先替代
2. **子组件/静态方法**：如 `SForm.useWatch`、`SButton.Group`
3. **类型定义**：Props 接口 + 关联类型，含 JSDoc 描述
4. **组合组件引用**：本组件 Props 里引用了哪些外部类型，内联它们的核心属性

### metadata.json 字段标准

同一目录下的 `metadata.json`（组件库作者手写，历史项目由 Skill 辅助生成）：

```json
{
  "useWhen": [
    "管理后台标准列表页（搜索 + 表格 + 分页）"
  ],
  "dontUseWhen": [
    "纯展示表格，无搜索条件，直接用 STable"
  ],
  "prefer": {
    "STable + SForm.Search + useSearchTable": "需要更精细控制时"
  }
}
```

| 字段 | 意义 | 写作要求 |
|------|------|---------|
| `useWhen` | 这个组件**应该**用的场景 | 用业务语言描述，不要写技术实现。好："需要搜索+表格+分页联动的列表页"。差："当需要 SSearchTable 时"。 |
| `dontUseWhen` | 看起来像但**不应该**用这个组件的场景 | 每条必须给出替代方案（"直接用 XXX"）。这是 AI 最需要的信息。 |
| `prefer` | 在这个场景下**优先用别的** | key=更优方案，value=什么时候用那个方案 |

---

## 路线 A：组件库文档化

> 触发：用户有一个 npm 组件库项目，想把它的 API 文档做成 AI 可消费的格式，随版本发布。

### 步骤

**步骤 1：确认组件目录结构**

读取 `package.json` 确认这是一个 npm 包。扫描 `src/components/` 确认组件数量和组织方式（每个组件一个目录 vs 单文件 vs 混合）。

向用户确认：
- 组件目录位置（默认 `src/components/`）
- 是否有 hooks/ 目录需要一并处理
- 目标输出位置（默认项目根目录 `ai/`）

**步骤 2：逐个组件生成 metadata.json 草稿**

对每个组件目录：
1. 读取 `index.tsx` — 理解组件的渲染逻辑和子组件注册
2. 读取 `types.ts` — 提取主 Props 接口名（优先 `{Name}Props`，其次 `S{Name}Props`）
3. 根据组件名和实现逻辑，推导 `useWhen` / `dontUseWhen` / `prefer`

输出每个组件的 metadata.json **草稿**，标注推导置信度：
- `[? 高]` — 从类型名和 JSDoc 能明确判断
- `[? 中]` — 能判断大致方向但边界模糊
- `[? 低]` — 完全不确定，需要人工填写

向用户展示草稿，逐条确认或跳过。

**步骤 3：检查并补充 JSDoc**

对每个组件的 `types.ts`：
1. 列出所有 `export interface` 和 `export type`
2. 检查 Props 接口是否有顶层 JSDoc
3. 检查每个属性是否有单行注释或 JSDoc
4. 列出缺失项

**JSDoc 写作规范（给 AI 看的）**：

```
好 — 说清楚"什么时候需要这个字段"和"值从哪里来"：
  /** 数据请求函数。接收搜索参数+分页参数，返回 { dataList, totalSize } 格式 */
  requestFn: (data?: any) => Promise<any>;

差 — 重复字段名或说废话：
  /** 请求函数 */
  requestFn: (data?: any) => Promise<any>;

差 — 只有技术描述，没有业务含义：
  /** Function */
  requestFn: (data?: any) => Promise<any>;
```

对缺失的 JSDoc，AI 根据组件逻辑推导草稿，标注 `[?]`，人工确认。

**步骤 4：配置 package.json**

确认以下三项：

```json
{
  "files": ["dist", "ai"],
  "scripts": {
    "ai:generate": "tsx scripts/gen-llms-txt.ts",
    "prepublishOnly": "... && npm run ai:generate"
  }
}
```

- `files` — 确保 `ai/` 目录进入 npm 包
- `ai:generate` — 如果用户已有类似 gen-llms-txt.ts 的脚本，保持；如果没有，告知用户需要自己实现（本 Skill 不替代类型提取脚本，它做的是扫描 TS 做结构化提取，本质是编译器工作）
- `prepublishOnly` — 确保每次发布前自动更新文档

**步骤 5：首次生成并验证**

运行 `npm run ai:generate`，检查产出：
- `ai/README.md` — 索引是否覆盖所有组件、使用边界是否完整
- `ai/components/` — 每个 .md 是否包含类型定义 + 组合引用
- 格式是否干净（无多余空行、无断开链接）

---

## 路线 B：历史项目盘活

> 触发：项目 `src/components/` 下有一堆组件，没有文档，AI 不认识它们。

### 步骤

**步骤 1：组件清单扫描**

扫描目标目录（默认 `src/components/`），列出所有组件：

```
组件名          目录              类型文件      子组件  优先级
────────────────────────────────────────────────────────
UserTable       src/components/   types.ts ✅   有 Modal  🔴 高（列表页核心）
StatusBadge     src/components/   types.ts ✅   无        🟡 中
DataChart       src/components/   内联类型       无        🟡 中
OldReport       src/components/   无类型文件     无        🟢 低（疑似废弃）
```

优先级判断依据：
- 🔴 高：被多个页面引用、位于路由页面中、名字含 Table/Form/Detail
- 🟡 中：被引用但范围有限、纯展示类
- 🟢 低：无引用、名字含 Old/Deprecated、文件最近未修改

向用户确认优先级和范围："共发现 N 个组件，其中 X 个高优先级。建议先盘活高优先级的，逐步推进。"

**步骤 2：逐个读取并提取类型**

对每个选中的组件：

1. 读取源码（`.tsx` 或 `.tsx` + `types.ts`）
2. 提取 Props 信息：
   - 如果 `types.ts` 中有独立 interface → 直接提取所有属性 + JSDoc
   - 如果类型内联在 `.tsx` 中 → 解析 function 参数或 React.FC<>
   - 如果使用了 PropTypes → 从 PropTypes 推导类型
   - 如果完全没有类型 → 从代码中使用方式推导参数名和用途，标注 `[?]`
3. 提取子组件（如 Modal、Drawer、内部注册的静态方法）

**步骤 3：推导师徒信息，生成 metadata.json 草稿**

读取组件代码逻辑和引用位置，推导 `useWhen` / `dontUseWhen` / `prefer`：

- **useWhen**：从组件名 + 渲染内容推导。"UserTable" → "用户数据列表展示"
- **dontUseWhen**：从代码中寻找 if/switch/return null 等边界逻辑推导
- **prefer**：检查组件内部是否引用了更基础的组件（如用了 STable 自己又包了一层 → prefer STable）

所有推导项标 `[? 待确认]`。

**步骤 4：人工确认环节**

对每个组件，输出一份简短的确认清单：

```
=== StatusBadge (🟡 中优先级) ===

类型提取：
  ✅ Props: { status: string, size?: 'small'|'default' }
  ✅ 有 JSDoc
  [?] metadata.useWhen: "需要将状态码映射为彩色标签时" — 准确吗？
  [?] metadata.dontUseWhen: 不确定 — 状态为 null 时这个组件会显示什么？

请逐条确认或补充。
```

**步骤 5：生成 .ai/ 文档**

确认完成后，按标准格式生成：
- `.ai/project-components/README.md` — 索引
- `.ai/project-components/{Name}.md` — 详情

路径建议放在 `.ai/project-components/` 下，与组件库文档 `.ai/sdesign/` 区分。

---

## 路线 C：消费端同步

> 触发：项目已经把带 ai/ 的组件库装好了，需要把文档同步到 AI 可读的位置。

### 步骤

**步骤 1：扫描已安装的组件库**

查找 `node_modules` 中所有包含 `ai/README.md` 或 `ai/components/` 的依赖：

```bash
# 快速扫描命令
find node_modules -maxdepth 4 -path '*/ai/README.md' | head -20
```

列出所有有 AI 文档的依赖，向用户确认需要同步哪些。

**步骤 2：配置同步脚本**

对于 pnpm 项目，在 `package.json` 中添加：

```json
{
  "scripts": {
    "sync-ai-docs": "node -e \"... 复制脚本 ...\"",
    "postinstall": "pnpm sync-ai-docs"
  }
}
```

同步逻辑：
1. 遍历 `node_modules` 找到所有 `ai/` 目录
2. 按包名复制到 `.ai/{package-name}/`
3. 生成总索引

**步骤 3：首次执行**

运行 `pnpm sync-ai-docs`，验证：
- `.ai/sdesign/README.md` + `components/` 存在且可读
- 其他组件库的文档也一并同步

---

## 核心参考：JSDoc 给 AI 看的写法规范

> 以下规范适用于路线 A 和路线 B。目标：让 AI 看到 JSDoc 就知道字段怎么用。

### Props 顶层 JSDoc

```
/**
 * SSearchTable 搜索表格组件 Props
 *
 * 集成 SForm.Search + STable 的一体化组件，是管理后台列表页的首选方案。
 * 自动处理搜索、分页、数据加载的联动逻辑。
 *
 * @example
 * <SSearchTable
 *   requestFn={async (params) => ({ dataList, totalSize })}
 *   formProps={{ items: [...], columns: 3 }}
 *   tableProps={{ columns: [...], rowKey: 'id' }}
 * />
 */
```

要点：一句话定位 + 核心能力 + 最小可运行示例。

### 属性级 JSDoc

```
好：
  /** 数据请求函数。接收搜索参数+分页参数，返回 { dataList, totalSize } */
  requestFn: (data?: any) => Promise<any>;

  /** 搜索表单列数，默认 3 */
  columns?: number;

  /** 表格区域标题。不传则无标题栏 */
  tableTitle?: STitleProps;

差：
  /** 请求函数 */
  requestFn: Function;

  /** columns */
  columns?: number;
```

规则：
- 说清楚"什么时候需要设这个字段"和"不设会怎样"
- 引用其他类型时说明"来自哪个组件/接口"
- 默认值必须写明
- 必填字段可以简短，但必须说清楚用途

---

## 验证清单

- [ ] 每个组件都有 metadata.json（useWhen / dontUseWhen / prefer 三项至少有一项有内容）
- [ ] Props 接口有顶层 JSDoc
- [ ] 每个属性有注释（无注释的标 `[?]` 并告知用户）
- [ ] ai/README.md 包含所有组件
- [ ] ai/components/ 下每个 .md 格式一致（使用边界 → 子组件 → 类型 → 组合引用）
- [ ] dontUseWhen 每条都给出了替代方案
