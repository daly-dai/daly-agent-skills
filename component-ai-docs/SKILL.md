---
name: component-ai-docs
description: "盘活项目中的存量业务组件，让 AI 认识它们。自动扫描组件清单、深度搜集类型定义和真实使用案例、生成 AI 可消费的标准文档。触发词：组件文档、AI组件文档、盘活组件、提取组件API、让AI认识组件、component docs for AI、项目组件文档。"
---

# Component AI Docs

> 盘活项目中的业务组件——让 AI 认识你项目里那些没有文档的存量组件。

**核心问题**: AI 写前端代码时，不知道项目里有哪些业务组件、接受什么 Props、什么时候该用什么时候不该用。

**解决思路**: 通过深度搜集组件源码、关联类型、真实使用案例，生成 AI 可消费的标准文档。高频组件优先，分批推进。

---

## 核心原则

1. **开发者最了解组件。** `metadata.json` 里的"何时用/何时不用"只有人能写对——Skill 的角色是引导写出来，不是替代判断。
2. **JSDoc 写给人看的不等于写给 AI 看的。** "用户名称"是给人看的，"必填，用于表格列渲染和搜索条件"是给 AI 看的。
3. **先盘核心，再补全量。** 20 个组件里高频使用的可能就 5 个，优先盘活这几个。
4. **真实案例胜过编造示例。** 项目里已有大量使用案例，搜集它们比 AI 编造示例更有价值。

---

## 输出格式标准

> 这是本 Skill 的"输出锁"——最终产出的文档必须符合以下格式。

### 目录结构

```
.ai/project-components/
├── README.md                    # 索引层：组件速查表（用途 + 边界 + 一句话描述）
└── components/
    ├── UserTable.md             # 详情层：完整 Props + 使用案例
    ├── StatusBadge.md
    └── ...
```

### README.md 索引层（给 AI 第一步看）

AI 先读这个，快速判断"有没有我能用的组件"，再按需读取具体组件的详情文件。不一次性全读。

### components/{Name}.md 详情层（给 AI 要用时看）

每个文件应包含：

1. **使用边界**（最优先）：何时适用、何时不适用、优先替代
2. **子组件/静态方法**：如 `SForm.useWatch`、`SButton.Group`
3. **类型定义**：Props 接口 + 关联类型，含 JSDoc 描述
4. **有效接口**（使用统计）：基于项目内全部使用点统计的 Props 使用率 + 冗余标记 + any 反推
5. **组合组件引用**：本组件 Props 里引用了哪些外部类型，内联它们的核心属性
6. **实际使用示例**（从项目真实代码中提取）：2-3 个覆盖不同场景的使用案例，附简要说明

### metadata.json 字段标准

由 Skill 辅助生成，人工确认：

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
  },
  "sourceHash": "a1b2c3d4e5f6..."
}
```

| 字段 | 意义 | 写作要求 |
|------|------|---------|
| `useWhen` | 这个组件**应该**用的场景 | 用业务语言描述，不要写技术实现。好："需要搜索+表格+分页联动的列表页"。差："当需要 SSearchTable 时"。 |
| `dontUseWhen` | 看起来像但**不应该**用这个组件的场景 | 每条必须给出替代方案（"直接用 XXX"）。这是 AI 最需要的信息。 |
| `prefer` | 在这个场景下**优先用别的** | key=更优方案，value=什么时候用那个方案 |
| `sourceHash` | 组件入口文件的 SHA256 hash | 用于后续文档保鲜检测（`--check` 模式对比当前源码 hash） |

---

## 执行流程

### 第一步：扫描并保存组件全量清单

**1a. 检查是否已有清单**

先检查 `.ai/project-components/.component-list.json` 是否存在。

**如果存在** → 读取清单，显示进度，让用户选择本次处理哪个优先级：

```
组件清单已存在（2024-01-15 创建）：

=== 高优先级（5 个）===
  ✅ UserTable        — 已完成
  ⬜ SearchForm       — 未处理
  ⬜ DataTable        — 未处理
  ...

=== 中优先级（8 个，全部未处理）===
  ⬜ StatusBadge
  ...

=== 低优先级（7 个，全部未处理）===
  ⬜ OldReport
  ...

已完成 1/20。请选择本次处理的优先级：高 / 中 / 低？
```

> 用户选择一个优先级后，跳到第二步。如果所有组件已完成，提示"全部完成"。

**如果不存在** → 执行 1b 首次扫描。

**1b. 首次扫描**

Glob 扫描多目录（根据项目结构选用）：
```
src/components/**/*.tsx
src/pages/**/components/**/*.tsx
src/business/**/*.tsx
src/widgets/**/*.tsx
src/modules/**/components/**/*.tsx
```

列出发现的目录及组件数量，向用户确认范围。

确认后，搜索每个组件的引用次数（搜 `import ... from '...<ComponentName>'`），按优先级分组并**保存到 `.component-list.json`**：

```json
{
  "createdAt": "2024-01-15",
  "high": [
    {"name": "UserTable", "file": "src/components/UserTable.tsx", "refs": 12, "done": false}
  ],
  "medium": [
    {"name": "StatusBadge", "file": "src/components/StatusBadge.tsx", "refs": 6, "done": false}
  ],
  "low": [
    {"name": "OldReport", "file": "src/components/OldReport.tsx", "refs": 0, "done": false}
  ]
}
```

优先级判定：Props > 10 或有子组件或 > 8 处引用 → high；3-8 处引用 → medium；< 3 处 → low。

输出清单并询问：

```
共 20 个组件：高优 5 个，中优 8 个，低优 7 个。清单已保存。
建议先处理高优。本次处理哪个优先级？（高 / 中 / 低）
```

> 如果总数 > 30，建议缩小目录范围再扫描。

### 第二步：批量搜集选定优先级的组件

从 `.component-list.json` 中读取选中优先级中 `done: false` 的组件，一次性批量搜集：

**2a. 批量提取 Props**

对该批次所有组件文件，循环执行：
```
npx react-docgen --resolver ts <文件路径>
# 如果 npx 失败：./node_modules/.bin/react-docgen --resolver ts <文件路径>
# 两条都失败 → 手工读源码提取
```

检查每个组件的输出：
- 有具体类型名 → ✅ 直接用
- 全是 `any`/`unknown` → ⚠️ 保留结构，标 `[?]`
- 失败 → 手工提取，全部标 `[?]`

同时记录每个组件的子组件。

**2b. 批量搜索关联类型**

用 Grep 一次性搜索该批次组件名：
```
grep -r "(ComponentA|ComponentB)" src/types/ src/api/
```

**2c. 批量搜索使用案例**

用 Grep 一次性搜索该批次所有组件的调用位置：
```
grep -r "<\(ComponentA\|ComponentB\)" src/pages/ src/views/
grep -r "import.*\(ComponentA\|ComponentB\)" src/
```

将搜索结果按组件名分拣。每个组件取 2-3 个不同场景的案例，超过 10 处的取 3-5 个。

### 第三步：逐组件处理并立即保存

> **核心原则：处理完一个就存一个，不攒到最后。崩了只丢当前这一个。**

对该批次中每个组件，依次执行：

**3a. 统计有效接口** — 基于第二步的搜索结果，统计每个 Props：
- 使用率 = 传入次数 / 总使用次数
- 0 次 → `[❗疑似冗余]`
- `any` 但使用点一致 → `[✅ 实际类型: X]`

**3b. 推导 metadata** — 先读统计结果，再按模板填空：
- `useWhen = "<组件名> 用于 <使用案例的共同场景>"`
- `dontUseWhen` — 逐条检查：冗余 Props / return null 分支 / 简单包装底层组件
- `prefer = { "<底层组件>": "需要精细控制时" }`
- 所有项标 `[? 待确认]`

**3c. 计算 sourceHash** — `sha256sum <组件文件路径>`

**3d. 人工确认** — 输出确认清单：
```
=== <组件名> ===
类型：✅ <摘要>
有效接口：✅ <必传> / ❗ <冗余>
metadata：[?] useWhen / dontUseWhen
sourceHash: <hash>
请逐条确认或补充。
```

**3e. 立即保存文档** — 确认后立刻写文件：
- `components/<组件名>.md` — 按模板生成（使用边界 → 子组件 → 类型定义 → 有效接口 → 组合引用 → 使用示例）
- 更新 `metadata.json`

**处理完一个组件后，再开始下一个。每个组件独立保存。**

### 第四步：更新进度，汇报

1. 将本批次处理完的组件在 `.component-list.json` 中标记 `"done": true`
2. 更新 `README.md` 索引
3. 汇报进度：

```
本批次完成 X 个组件：UserTable, SearchForm, ...
总进度：M / N（高优 M1/N1, 中优 M2/N2, 低优 M3/N3）
下次新建任务时，执行本 skill 即可继续处理剩余组件。
```

---

## 文档保鲜：检测过时文档

当用户说"检查组件文档是否过时"或"更新组件文档"时，执行以下检测：

1. 读取 `.ai/project-components/` 下所有 metadata.json，提取每个组件的 `sourceHash` 和源文件路径
2. 对每个组件的源文件执行 `sha256sum <源文件路径>`，与记录的 hash 对比
3. 输出差异清单：

```
文档保鲜检测：
  ✅ UserTable     — 文档与源码一致
  ❌ StatusBadge   — 源码已变更（旧 hash: a1b2..., 新 hash: e5f6...），文档可能过时
  ✅ DataChart     — 文档与源码一致
  ✅ OldReport     — 未变更

共 N 个组件：X 个一致，Y 个可能过时。建议对过时组件重新执行第二步和第三步。
```

> 此检测只读不写，不修改任何源码或文档，零风险。

---

## JSDoc 写法规范（给 AI 看的）

> 目标：让 AI 看到 JSDoc 就知道字段怎么用。

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

- [ ] 第一步已向用户确认组件目录范围
- [ ] 第二步对该批次组件做了批量搜索（非逐个重复搜）
- [ ] 每个组件都尝试了 react-docgen 提取 Props（不可用时已回退）
- [ ] 第三步逐组件处理，每个组件处理完立即保存（不攒到最后）
- [ ] 每个组件都有 metadata.json（useWhen / dontUseWhen / prefer / sourceHash 至少前三项有内容）
- [ ] metadata.json 包含 sourceHash
- [ ] Props 接口有顶层 JSDoc
- [ ] 每个属性有注释（无注释的标 `[?]` 并告知用户）
- [ ] README.md 索引覆盖所有已处理组件
- [ ] 每个 .md 格式一致（使用边界 → 子组件 → 类型 → 有效接口 → 组合引用 → 使用示例）
- [ ] 有效接口表基于全部使用点统计，含使用率 + 冗余标记 + any 反推
- [ ] dontUseWhen 每条都给出了替代方案
- [ ] 每个组件至少有 2 个来自真实代码的使用示例，标注了来源路径
