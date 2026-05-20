---
name: component-ai-docs
description: "盘活项目中的存量业务组件，让 AI 认识它们。脚本扫描组件清单 + Props，AI 补充语义描述。触发词：组件文档、AI组件文档、盘活组件、提取组件API、component docs for AI。"
---

# Component AI Docs

> 让 AI 认识你项目里的业务组件——接受什么 Props、什么时候用、什么时候不用。

## 核心原则

1. **脚本做结构提取，AI 做语义描述。** 脚本找到组件文件、提取 Props 字段、统计引用次数。AI 读源码 + 使用示例，描述"何时用/何时不用"。
2. **有边界。** 脚本遇复杂类型标注 `[待确认]`，AI 读不懂也标注 `[待确认]`。不强求全覆盖。
3. **先高频，后低频。** 引用 >= 5 次的组件优先盘活。

## 执行流程

### Step 1: 首次扫描

运行脚本扫描项目中的业务组件：

```
node <skill-dir>/scripts/scan-components.mjs <项目根目录>
```

可选参数：
- `--dir <path>` — 只扫描指定子目录
- `--output <path>` — 自定义输出路径

产出：`.ai/project-components/.component-list.json`

脚本做的事（有边界）：
- 找到 PascalCase 命名的组件文件
- 提取同文件内的 `interface XxxProps` 字段和类型
- 统计每个组件被 import 的次数
- 列出 2-3 个使用示例文件路径
- 复杂类型（泛型、交叉类型、外部导入）标注 `[待确认]`

**脚本输出 "No component files matched"** → 告知用户，询问 `--dir` 路径后重试。

**组件数 > 30** → 告知用户建议缩小范围，询问是否继续。

### Step 2: 展示进度，选择批次

读取 `.component-list.json`，展示：

```
组件清单（共 15 个）：

=== 高优先级（>= 5 次引用）===
  ⬜ UserSelector    — 12 次引用，Props: 5 个字段(1 个待确认)
  ⬜ StatusTag       — 8 次引用，Props: 3 个字段

=== 中优先级（2-4 次引用）===
  ⬜ DeptTree        — 3 次引用，Props: 4 个字段
  ⬜ FileUploader    — 2 次引用，Props: 未找到

=== 低优先级（< 2 次引用）===
  ⬜ DataCard        — 1 次引用，Props: 6 个字段(2 个待确认)
  ...

Props 提取概况: 素材 available: N/M, 素材 partial: N/M, 素材 missing: N/M.
```

询问用户：**选择优先级：高 / 中 / 低？**

### Step 3: 逐组件生成文档

一次处理一个组件，填 @FILL 标记后写入文件。每完成 5 个暂停，汇报摘要等待用户确认。

#### 3a. 读取材料

读取 `.component-list.json` 中该组件的条目，含 `props`、`usageExamples`。

如果 `usageExamples` 非空，用 Read 读取第一个使用示例文件，定位该组件的 JSX 使用片段（约 10 行）。

#### 3b. 填 @FILL 标记

```
@FILL:VALUE component_summary [P0]
提示: 一句话描述该组件的功能。从组件名 + Props + 使用示例推断。

@FILL:TABLE props_table [P0]
提示: 从 .component-list.json 中取 props 字段。对每个 prop 补充「用途说明」列。
列: 参数名 | 类型 | 必填 | 用途说明

@FILL:BLOCK usage_snippet [P1]
提示: 从 usageExamples 第一个文件中提取该组件的 JSX 使用片段（~10 行，代码块格式）

@FILL:VALUE use_when [P0]
提示: 用一句业务语言描述何时使用该组件，基于 Props + 使用场景推断。不确定则写"[? 待确认] 需人工补充"

@FILL:VALUE dont_use_when [P1]
提示: 反推何时不该用。无明确排除场景则写"暂未发现排除场景"

@FILL:VALUE prefer [P2]
提示: 同目录下有无类似组件可作为替代。无则写"暂未发现替代方案"
```

**填充规范**：
1. 遇到无法确定的内容填 `[待确认]`，不猜测
2. Props 中脚本标注 `[待确认]` 的复杂类型，AI 阅读源码后尝试补充，仍无法确定则保留 `[待确认]`
3. `use_when` / `dont_use_when` / `prefer` 默认标注 `[? 待确认]`，引导开发者在 metadata.json 中修正

#### 3c. 写入文件

按 `references/output-format.md` 模板生成以下文件：

1. `.ai/project-components/components/<组件id>/index.md`
2. `.ai/project-components/components/<组件id>/metadata.json`

写入后 `Read` 验证文件非空。

#### 3d. 暂停汇报

每 5 个组件暂停一次：

```
完成第 1-5 个组件：

1. UserSelector — useWhen: "表单中选择用户，支持按部门筛选" [? 待确认]
                  dontUseWhen: "单选用户且不需要部门筛选 → 可直接用 Select" [? 待确认]
2. StatusTag    — useWhen: "渲染状态枚举列，支持 dictKey" [? 待确认]
...

以上需要修改吗？输入序号+修改内容，或输入"继续"。
```

---

## 参考文档

| 文件 | 内容 | 何时读 |
|------|------|--------|
| `references/output-format.md` | 目录结构、index.md 模板、metadata.json 规范 | Step 3c 写入时 |
| `references/jsdoc-guidelines.md` | Props 注释写法规范 | Step 3b 填 props_table 时 |

---

## 注意事项

- 脚本只做结构化提取，不解析 AST、不处理桶文件转发
- 组件 Props 中标注 `[待确认]` 的字段，由 AI 在 Step 3b 尝试补充
- `useWhen` / `dontUseWhen` 最终只有开发者能写对——AI 产出的是初稿，需人工审核
