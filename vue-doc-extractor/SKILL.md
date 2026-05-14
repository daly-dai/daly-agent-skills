---
name: vue-doc-extractor
description: "从 Vue 3 页面组件中提取框架无关的产品文档(Markdown)，用于跨框架迁移和新人快速上手。支持场景：查询列表(query-list)、表单(form)、详情页(detail-page)、审批流(approval-flow)、整模块(module)。触发词：提取文档、提取产品文档、vue文档提取、extract vue doc、页面文档、模块文档提取。"
---

# Vue Doc Extractor

从 Vue 3 页面组件源码中提取**框架无关**的产品文档，核心目标：

1. **跨框架可迁移**：提取出的文档能让开发者在 React、Vue 或其他框架中快速还原同样的页面
2. **快速理解业务**：新入手的成员通过文档能在几分钟内理解页面的完整逻辑

## 核心原则

- **描述业务逻辑，而非框架实现**：输出"下拉选择"而非"a-select"，输出"文本输入框"而非"a-input"
- **数据流转是重点**：页面间跳转传了什么参数、弹窗打开传了什么数据、表单提交如何组装参数、编辑时数据如何回显 — 这些是最有价值的信息
- **说清楚"为什么"**：不只是列字段，要说明业务含义、联动原因、权限逻辑
- **输出为 PRD 可消费格式**：提取产物应可直接作为技术蓝图的输入，聚焦"数据是什么"和"行为是什么"，不描述框架实现

## 输入格式

### 单场景调用（原有方式）

```
/vue-doc-extractor <场景类型> <主Vue文件路径> [关联文件路径...]
```

### 模块级调用（新增）

```
/vue-doc-extractor module <模块目录路径>
```

**场景类型**（必选其一）：

| 场景类型 | 说明 |
|---------|------|
| `query-list` | 查询列表页（搜索条件 + 数据列表 + 操作项 + 页面跳转/弹窗交互） |
| `form` | 表单页（新增/编辑/新增编辑复用，含字段定义 + 校验 + 提交参数组装 + 数据回显） |
| `detail-page` | 详情页（多Tab数据展示 + 数据加载分发 + 操作入口） |
| `approval-flow` | 审批流页面（状态机 + 审批操作 + 数据流转） |
| `module` | 整模块分析（自动扫描目录，识别并提取所有页面，生成模块级文档） |

**主Vue文件路径**：要分析的 `.vue` 单文件组件路径。

**关联文件路径**（可选）：相关子组件、弹窗组件、composable 等文件，提供后会一并分析。

## 执行流程

### Step 1: 参数校验

1. 校验场景类型是否为上述 **5 种**之一（`query-list` / `form` / `detail-page` / `approval-flow` / `module`），否则报错并列出所有合法类型。
2. 当场景类型为 `module` 时：
   - 使用 List 工具检查模块目录是否存在且包含 `.vue` 文件；
   - 若目录不存在或无 `.vue` 文件，报错并停止。
3. 当场景类型为非 `module` 时：
   - 使用 Read 工具检查主 Vue 文件是否存在；
   - 检查文件是否包含 `<template>` 和 `<script`，确认是 Vue SFC（若不是，只给出警告但继续尝试）。

### Step 2: 加载提取指南

按以下流程按需加载参考文件（使用 Read 工具）：

#### 2.1 检测 UI 库

运行 `node scripts/detect-ui-lib.mjs <项目根目录>` 检测项目使用的组件库。

检测结果为**空格分隔的库标识列表**，例如：`antd`、`element`、`antd element`、`unknown`。

> 新增组件库时，只需在 `scripts/detect-ui-lib.mjs` 中添加对应的检测规则，无需修改本 SKILL.md。

#### 2.2 加载通用模式

始终加载：
- `${CLAUDE_SKILL_DIR}/references/patterns-core.md` — Vue3 代码模式识别 + 数据流转追踪指南（框架无关）
- `${CLAUDE_SKILL_DIR}/references/patterns-ui-mapping.md` — 通用 UI 术语映射表 + 组件识别速查表（框架无关）

#### 2.3 按需加载组件库模式

将检测结果按空格拆分为库标识列表，对每个标识加载对应的模式文件：
- 对列表中的每个库标识 `${lib}`，加载 `${CLAUDE_SKILL_DIR}/references/patterns-${lib}.md`
- 若检测结果为 `unknown`，则加载 `${CLAUDE_SKILL_DIR}/references/` 目录下所有 `patterns-*.md` 文件（保险策略）

> 各 `patterns-${lib}.md` 只包含该组件库**特有的交互模式、与主流库的差异对比、常见代码片段**，组件基础识别信息已集中在 `patterns-ui-mapping.md` 中。

#### 2.4 加载场景指南

- `module` 场景 → 加载 `${CLAUDE_SKILL_DIR}/references/scenario-module.md`（该指南会引导逐页面调用其他 scenario 指南）
- 其他场景 → 加载对应的 `${CLAUDE_SKILL_DIR}/references/scenario-{场景类型}.md`

> 这些文件包含了你需要遵循的详细提取规则和输出格式，务必完整阅读后再开始提取。

### Step 3: 分析源码

1. **读取主 Vue 文件**：完整读取文件内容，识别 `<template>`、`<script setup>`（或 `<script>`）、`<style>` 三个区块。

2. **追踪关键依赖**（浅层）：
   - 识别 `<script>` 中所有 `import` 语句
   - 对**本地常量/枚举文件**（路径含 `constants`、`enums`、`config`、`dict`、`columns` 等）：使用 Read 读取，提取当前页面用到的所有常量的**完整定义值**（参考 patterns-core.md 第8节）
   - 对**本地 composable/hook** 文件：使用 Read 读取，提取其中的 API 调用和状态逻辑
   - 对**本地 API 模块**文件：使用 Read 读取，提取 API 函数签名和请求路径
   - 对**本地子组件**（弹窗/抽屉等）：如果用户提供了关联文件则读取分析，否则仅记录组件名和路径
   - 对**第三方库**：根据组件标签前缀识别对应组件库（如 `a-*` → Ant Design Vue、`el-*` → Element Plus 等），具体映射关系参考 `patterns-ui-mapping.md`

3. **如果用户提供了关联文件**：逐一读取并纳入分析范围。

### Step 4: 按场景提取信息

#### 4.1 @FILL 填充流程

按照 `scenario-{场景类型}.md` 中的**提取清单**分析源码，然后逐轮填充 `@FILL` 标记。

**@FILL 机制**：

每个 `@FILL` 标记是一个独立的小提取任务，格式为：
```
@FILL:<TYPE> <id> [P0|P1|P2]
提示: <提取内容说明>
```

填充时返回：
```
@FILLED:<id>
<内容>
@END
```

**分轮提取策略**（每轮独立，弱模型不会丢失上下文）：

| 轮次 | 优先级 | 内容 | 包含标记 |
|------|-------|------|---------|
| **第一轮** | P0 | 数据流转 + API 契约 | page_title, page_overview, form_type, entry_info, form_fields, field_diff, submit_*, data_load, backfill_map, search_fields, query_param_mapping, list_columns, operations, operations_detail, api_list_query, api_all |
| **第二轮** | P1 | 字段 + 联动 + 状态 | form_layout, validations, linkage_*, toolbar, pagination, row_key, row_selection |
| **第三轮** | P2 | 常量 + 权限 + 引用 | constants, references, api_other, other_interactions, notes |

> 每轮启动时用 Read 重新加载对应 scenario 文件中该轮的标记定义，确保标记不遗漏。

**填充关键规则**：
- 提取信息必须基于实际代码，不得臆测
- 无法确定的内容标注 `待确认` 而非猜测
- **使用通用 UI 术语**，不使用框架特定组件名：详见 [patterns-ui-mapping.md](references/patterns-ui-mapping.md)
- 如该标记在当前页面无对应内容，填相关否定说明（如"无条件显隐"、"无外部常量"）而非留空
- **常量/枚举必须内联实际值**：当代码引用外部常量时，在文档中展开其完整定义（值映射、选项列表等），并标注 `[常量]` 标记。不能只写常量名让迁移方猜测（详见 patterns-core.md 第8节）

- **API 契约完整记录**（后端接口固定不变，是新项目直接复用的基础）：
  - 记录 API 函数名、请求方式、请求路径
  - 记录请求入参结构（哪些字段、什么类型、是否必传）
  - 记录响应数据结构（前端实际使用了哪些响应字段）
  - 记录前端字段名与接口字段名的映射关系（尤其是名称不一致或需要转换的情况）
- **数据流转必须追踪清楚**：路由参数、Props 传递、弹窗数据、表单组装、回显映射
- 权限控制需要记录具体的权限标识或条件表达式
- 注意识别 TypeScript 类型定义，它们能补充字段信息

#### 框架无关输出规范

详见 [patterns-output-spec.md](references/patterns-output-spec.md)

#### 4.2 模块级提取（module）

当场景类型为 `module` 时，按以下流程执行：

1. **扫描目录**：使用 List 工具扫描指定模块目录下所有 `.vue` 文件

2. **识别场景类型**：按文件名和内容识别各文件的场景类型
   - 文件名含 `list`、`index`、`table` 等 → `query-list`
   - 文件名含 `form`、`edit`、`create`、`add` 等 → `form`
   - 文件名含 `detail`、`view`、`info` 等 → `detail-page`
   - 文件名含 `approve`、`audit`、`workflow` 等 → `approval-flow`
   - 不确定时通过代码内容判断（如有无表格、表单、审批状态等）

3. **按依赖顺序提取**：按页面间依赖关系逐个提取（先列表页 → 表单页 → 详情页 → 审批流）

4. **逐页面填充 @FILL**：每个页面按其对应 scenario 文件的 @FILL 标记执行，参照 4.1 节的分轮策略

5. **汇总跨页面数据流**：
   - 整理页面间跳转参数传递关系
   - 识别共享的 API 模块、composable、类型定义
   - 汇总模块级状态管理和数据共享机制

6. **组装模块文档**：将各页面 @FILLED 内容按 `scenario-module.md` 组装模板拼装为单个文档

### Step 5: 输出自检（🛑 必执行）

在所有 @FILL 标记填充完成后、组装文档前，**必须**逐条执行以下检查：

1. **读翻译规则表**：Read `references/patterns-core.md` 第 9 节

2. **逐 @FILLED 扫描**，确认不包含 `patterns-core.md` 第 9.7 节列出的任何禁止项：
   - 无 UI 组件标签名（`a-*`、`el-*`、`van-*`）
   - 无框架 API（`ref`、`reactive`、`computed`、`watch`、`defineProps`）
   - 无路由 API（`router.push`、`route.params`）
   - 无文件路径（`src/`、`@/`、`./`、`../`）
   - 无框架指令（`v-if`、`v-model`、`@click`）
   - 无生命周期函数名（`onMounted`）
   - 无框架消息函数（`message.success`、`ElMessage`、`Modal.confirm`）

3. **如发现禁止项** → 对照 `patterns-core.md` 第 9.1-9.6 节翻译表 → 替换 → 重新输出该 @FILLED

4. **确认所有枚举/常量值已内联**（标注 `[常量]`，含实际值）

5. **确认所有操作行为用自然语言描述**，不出现框架特定写法

> ⛔ 此步骤不可跳过。未通过自检的 @FILLED 内容禁止进入文档组装阶段。

### Step 6: 组装输出文档

将 Step 4 填充的 `@FILLED` 内容，按 `scenario-{场景类型}.md` 中的**组装模板**拼装为最终 Markdown 文档。

**拼装规则**：
- 用组装模板的章节标题和结构作为骨架
- 将 `@FILLED:<id>` 的内容替换到模板中对应的占位位置
- TABLE 类型的 @FILLED 内容添加表头行后插入（表头从相应 @FILL 标记的"列:"行获取）
- P1/P2 标记如因分轮未填充，对应章节输出"未提取"并保留章节标题
- 字段名（fieldName）、API 函数名等技术标识保留原文
- **UI 控件统一使用通用术语**（输入框、下拉选择等），不使用任何框架特定的组件名

**输出规范**：
- 使用中文撰写所有标题、描述、说明
- 表格中不要留空白单元格，无内容的填 `-`
- 在文档末尾添加"提取说明"章节

## 输出长度控制

弱模型通过**分轮提取 + @FILL** 控制每轮输出量：

1. **每轮独立**：每轮只处理 ~5-12 个 @FILL 标记，不超过模型有效输出窗口
2. **优先级**（空间不足时按此顺序保留）：
   - P0: 数据流转（参数传递、回显映射、提交组装）、API 契约（入参+响应）
   - P1: 字段列表、状态定义、联动规则
   - P2: 校验规则、权限标识、引用模块
3. **压缩技巧**：
   - TABLE 类型合并可合并的行：直接赋值的字段映射合并为"以下字段直接映射: field1, field2, field3"
   - API 响应中前端未使用的字段不需要列出
   - 多个相同转换逻辑的字段可合并描述
4. **复杂页面**：如果某轮 @FILL 标记过多（字段数 > 20 或 API > 5 个），将该轮的 TABLE 标记拆分为多轮执行

## 注意事项

- 这是一个**只读**技能，绝不修改任何源码文件
- 单场景调用时，每次只处理**一个场景**；`module` 场景可处理整个模块
- 如果同一个 Vue 文件同时包含列表和表单（如嵌入弹窗），根据用户指定的场景类型决定重点，其他部分简要提及
- 如果发现文件使用的是 Options API 而非 Composition API，自动适配提取
- 优先从 TypeScript 类型/接口定义中获取字段类型信息
