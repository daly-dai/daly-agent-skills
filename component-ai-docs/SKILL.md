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

### 第一步：扫描组件目录，输出分组列表

Glob 扫描多目录（根据项目结构选用）：
```
src/components/**/*.tsx
src/pages/**/components/**/*.tsx
src/business/**/*.tsx
src/widgets/**/*.tsx
src/modules/**/components/**/*.tsx
```

列出发现的目录及组件数量，向用户确认范围。

确认后，搜索每个组件的引用次数，按优先级分组输出清单：

```
=== 高优先级（建议优先处理）===
UserTable     src/components/   12处引用   Props 18个，有子组件
SearchForm    src/business/      9处引用    Props 12个

=== 中优先级 ===
StatusBadge   src/components/   6处引用    Props 4个
DataChart     src/pages/dash/    4处引用    Props 7个

=== 低优先级（可最后处理或跳过）===
OldReport     src/components/   0处引用    疑似废弃
DeprecatedNav src/widgets/       1处引用    名字含 Deprecated

共 N 个组件：高优 X 个，中优 Y 个，低优 Z 个。
建议从高优开始，每批处理 1-2 个。是否开始？
```

> 如果组件总数 > 30，优先建议用户缩小范围："建议先处理 `src/components/` 目录的高优组件（共 X 个），其余目录后续再议。"

分批规则：
- 🔴 高优（Props > 10 或有子组件或 > 8 处引用）：每批 1-2 个
- 🟡 中优：每批 2-3 个
- 🟢 低优：每批 3-5 个（或跳过）

### 第二步：提取 Props 类型

**先执行，后判断——不预判组件类型质量。**

对当前批次每个组件：

1. 先执行：`npx react-docgen --version`。如果失败，跳到步骤 4。
2. 再执行：`npx react-docgen --resolver ts <组件文件路径>`
3. **检查输出**，按以下规则决定：
   - 输出有具体类型名（非 `any`/`unknown`）且 Props 属性数 > 0 → ✅ 直接使用，不需要再看源码
   - 输出有属性名但类型全是 `any`/`unknown` → ⚠️ 保留属性名和必填/可选信息，标记类型为 `[?]`，等第四步反推
   - 输出为空或报错 → 读源码手工提取（见步骤 4）
4. react-docgen 不可用时的手工提取：读 `.tsx` 源码，找 Props 类型定义（interface / React.FC<> / PropTypes）。如果完全没有类型，从参数解构推导属性名，全部标 `[?]`。

同时提取子组件（Modal、Drawer、静态方法等）。

### 第三步：搜集关联类型

搜索：`src/types/`（搜组件名/Props 类型名）、`src/api/`（搜关联接口类型）、组件内部 import 追踪。

### 第四步：搜集使用案例

搜索 `<ComponentName` 和 `import { ComponentName }` 的使用位置（pages/views/hooks/测试文件）。每个组件至少 2-3 个不同场景的案例。记录文件路径 + 组件调用代码片段。超过 10 处的取 3-5 个代表性案例。

### 第五步：统计有效接口

基于全部使用案例，对每个 Props 统计：

- **使用率** = 传入次数 / 总使用次数
- **实际传值** = 汇总所有使用点的传入值和类型
- 0 次传入 → `[❗疑似冗余]`
- `any` 但所有使用点类型一致 → `[✅ 实际类型: X]`

生成有效接口表（4 列：Prop | 声明类型 | 使用率 | 实际传值），写入最终文档。

### 第六步：推导使用边界 + metadata

⚠️ **先读取第五步生成的有效接口表，再做推导。不要跳过这一步。**

**useWhen** — 按模板填空：

```
useWhen = "<组件名> 用于 <从使用案例中找到的共同场景>"
```

从第四步搜集的使用案例中找共同模式。例：UserTable 所有案例都在列表页 → `"管理后台用户列表页（搜索+表格+分页）"`。

**dontUseWhen** — 逐条检查以下规则，有就写，没有就跳过：

1. 有效接口表中标记 `[❗疑似冗余]` 的 Props → `"不要因为看到 XX prop 就使用它，项目中实际零使用"`
2. 源码中有 return null 的分支 → 记录触发条件为不适用场景
3. 组件 import 了底层组件（如 STable）且只是简单包装 → `"需要精细控制时直接用 <底层组件名>"`

**prefer** — 检查组件 import 的底层组件：

```
prefer = { "<底层组件名>": "需要更精细控制时" }
```

所有推导项标 `[? 待确认]`。

用 `sha256sum <组件文件>` 计算 sourceHash，写入 metadata.json。

### 第七步：人工确认

输出确认清单，格式：

```
=== <组件名> (<优先级>) ===
类型提取：✅ <Props 摘要>
有效接口：✅ <必传> / ❗ <疑似冗余>
metadata：[?] useWhen / dontUseWhen
使用示例：✅ <来源> — <场景>
sourceHash: <hash>
请逐条确认或补充。
```

### 第八步：生成文档

生成 `.ai/project-components/README.md`（索引）和 `components/{Name}.md`（详情）。
每个详情文件按顺序：使用边界 → 子组件 → 类型定义 → 有效接口 → 组合引用 → 使用示例。

### 第九步：继续下一批

汇报本批次成果，确认是否继续下一批。全批次完成后更新 README 索引。

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

共 N 个组件：X 个一致，Y 个可能过时。建议对过时组件重新执行第二~八步。
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

- [ ] 步骤 1 已向用户确认组件目录范围（不限于单一目录）
- [ ] 每个组件都优先尝试了 react-docgen 提取 Props（不可用时已回退）
- [ ] 每个组件都有 metadata.json（useWhen / dontUseWhen / prefer / sourceHash 四项至少前三项有一项有内容）
- [ ] metadata.json 包含 sourceHash（组件入口文件 SHA256）
- [ ] Props 接口有顶层 JSDoc
- [ ] 每个属性有注释（无注释的标 `[?]` 并告知用户）
- [ ] .ai/project-components/README.md 包含所有已处理组件
- [ ] components/ 下每个 .md 格式一致（使用边界 → 子组件 → 类型 → 有效接口 → 组合引用 → 实际使用示例）
- [ ] 有效接口表基于项目内全部使用点统计，含使用率 + 冗余标记 + any 反推
- [ ] dontUseWhen 每条都给出了替代方案
- [ ] 每个高频组件至少有 2 个来自真实代码的使用示例
- [ ] 使用示例标注了来源文件路径
- [ ] 使用示例覆盖了不同的使用场景（非同质化）
