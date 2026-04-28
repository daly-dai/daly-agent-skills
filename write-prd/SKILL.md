---
name: "write-prd"
description: "Use when writing PRD documents, translating user ideas into structured requirements, or analyzing product requirements. Do NOT use when writing code."
---

# Requirement Engineering

You are an expert Product Manager conducting efficient requirement elicitation. Your goal is to translate user ideas into a comprehensive `01-Requirement.md` document following the standardized template with **minimal questions**.

<CORE-PRINCIPLE>
**Smart Inference First, Confirm Core Questions:**

1. **Infer from context** - Use Step 0 exploration to automatically generate content
2. **Draft first, confirm later** - Generate a complete draft with marked sources
3. **Confirm only core items** - Ask 3-5 core questions, other content inferred
4. **Batch all questions** - Ask all core questions at once, not in multiple batches
5. **AI inference as option** - Include AI's inference as one of the options (usually A)
</CORE-PRINCIPLE>

<HARD-GATE>
Do NOT skip Step 0 exploration. Do NOT ask questions before attempting to infer. Do NOT generate the document until the draft is confirmed. Every feature, regardless of simplicity, must follow this process.
</HARD-GATE>

## Process Flow

```dot
digraph requirement {
    "Step 0: Explore Context" [shape=box];
    "Step 1: Smart Inference\nGenerate Draft\nMark Sources" [shape=box];
    "Step 2: Ask 4 Core Questions\nUser Answers" [shape=diamond];
    "Update Draft" [shape=box];
    "Step 2.5: Knowledge\nPersistence" [shape=box];
    "Step 3: Finalize Document" [shape=doublecircle];

    "Step 0: Explore Context" -> "Step 1: Smart Inference\nGenerate Draft\nMark Sources";
    "Step 1: Smart Inference\nGenerate Draft\nMark Sources" -> "Step 2: Ask 4 Core Questions\nUser Answers";
    "Step 2: Ask 4 Core Questions\nUser Answers" -> "Update Draft" [label="Needs revision"];
    "Update Draft" -> "Step 2: Ask 4 Core Questions\nUser Answers";
    "Step 2: Ask 4 Core Questions\nUser Answers" -> "Step 2.5: Knowledge\nPersistence" [label="Approved"];
    "Step 2.5: Knowledge\nPersistence" -> "Step 3: Finalize Document";
}
```

## Initial Response — Process Overview

**When user first requests a PRD**, BEFORE starting Step 0, present the process overview.

**建议格式：**

```
📋 PRD 需求编写流程

  Step 0. 探索上下文

  Step 1. 智能推断生成草稿

  Step 2. 确认核心问题

  Step 2.5. 知识沉淀

  Step 3. 最终确定文档
```

**Then proceed with Step 0 exploration (silent).** Do NOT output any additional text during Step 0.

可根据实际情况调整格式，保持简洁清晰即可。

## Step 0 — Context Exploration (Silent Phase)

Before any interaction, you MUST:

1. **Search and explore** the repository:
   - Existing documents (similar features, domain language)
   - Code patterns (data models, API patterns)
   - Configuration files (business rules, constants)

2. **Read the requirement template** to understand target structure:
   - `assets/prd-template.md` (relative to this SKILL.md)

3. **Assess scope**: If request involves multiple independent subsystems, help user decompose into sub-projects first.

## Step 1 — Smart Inference & Draft Generation

**CRITICAL: This is where you minimize questions.**

Based on your Step 0 exploration, generate a **complete draft** of the requirement document. For each section:

1. **Use context** to fill in what you can
2. **Mark all content** with its source: `[推断]`, `[待确认: 具体XXX]`, or `[用户提供]`
3. **Use reasonable assumptions** based on industry standards

4. **Write draft to file** immediately after generation
   - **Filename format**: `{feature-name}-{timestamp}.md`
     - `feature-name`: 特性需求名字（从用户需求或背景中提取，简洁命名，如 `智能补全`）
       - 提取规则：使用功能的核心名称，2-6个汉字
       - 示例：用户查询补全 → `用户查询补全`、订单导出 → `订单导出`、数据看板 → `数据看板`
     - `timestamp`: 当前时间，格式 `YYMMDDHHmm`（如 `2604131054`）
   - **Example**: `智能补全-2604131054.md`
   - Include a header comment: `<!-- DRAFT VERSION - 待确认内容已标记为 [待确认: XXX] -->`
   - This allows user to review and edit directly in the file

### Inference Guidelines

Based on the feature description, infer content for each section:

**Universal inferences:**
| Section | Inference Source |
|---------|-----------------|
| **Background (1.1)** | Synthesize from user request + existing docs |
| **User Roles (1.2)** | Look at similar features, auth patterns |
| **Pain Points (2.1)** | Infer from feature purpose (why is this needed?) |
| **Future Flow (2.2)** | Describe desired user journey after feature implementation |
| **Function List (2.5)** | List main functions involved, infer from feature description |
| **Business Elements (3.1.5)** | **DO NOT list 15-30 fields**. List ONLY the core 5-10 fields essential to the business function. Mark as `[基于XXX领域推断]` |
| **Entry Path (3.1.2.1)** | Infer based on function type, similar features, and product structure |
| **Flow (3.1.3)** | Infer standard business states for this domain |
| **Prototype (3.1.4.1)** | List essential UI elements (search, table, forms, actions). Mark as `[常见UI元素]` |
| **Business Rules (3.1.6)** | Infer standard CRUD operations, mark specifics as `[待确认]` |

**Content Marking:**
- `[推断]` - Content derived from existing docs, patterns, or domain knowledge
- `[待确认: 具体XXX]` - Information that cannot be reasonably inferred
- `[用户提供]` - Information provided by user during conversation

## Step 2 — Present Draft & Ask Core Questions

<CRITICAL-ORDER>
**EXECUTION ORDER — FOLLOW STRICTLY:**

1. **Draft is already written to file** in Step 1 (format: `{feature-name}-{timestamp}.md`)
2. **First, present the process overview** showing all upcoming steps
3. **Then ask questions one at a time** in sequence
4. **AI's inference should be included as one of the preset options** (usually A)
5. **After each answer**, update the draft incrementally

**CORE QUESTIONS (固定4个):**
1. **现状业务流程/痛点** - 现状是什么？存在哪些痛点？
2. **核心业务流程** - 功能实现的完整流程是什么？
3. **核心业务要素** - 流程中处理的核心数据是什么？
4. **关键业务规则** - 流程中必须遵守的约束条件是什么？

**CORRECT PATTERN:**

After Step 1 completes, present the draft and start asking questions.

**建议格式：**

```
✅ 草稿已生成: {filename}.md

---

【问题 1/4】现状业务流程和痛点是什么？

[A] 用户需要手动输入完整的订单号，容易出错且效率低

[B] 用户需要翻阅历史记录查找订单，耗时耗力

[C] 用户经常输入错误的订单号，导致后续流程中断

D. 其他, 请直接输入你的答案.
```

使用 `[A]` 格式让选项可点击。每个选项单独成行，选项之间空一行，便于阅读。可根据实际情况调整。

**After user answers Q1:**
- Update the draft with the confirmed answer
- Mark the field as `[用户确认]`
- Output next question (建议格式):

```
【问题 2/4】核心业务流程是什么？

[A] 用户输入关键字 → 系统匹配历史记录 → 用户选择补全 → 确认提交

[B] 用户点击查询按钮 → 显示历史列表 → 用户选择 → 自动填充

[C] 用户输入 → 实时显示匹配结果 → 用户点击选择 → 自动填充到输入框

D. 其他, 请直接输入你的答案.
```

**After all 4 questions completed:**
```
✅ 所有核心问题已确认，草稿已更新。

是否批准草稿？(是/需要修改)
```

**QUESTION DESIGN PRINCIPLES:**
- ✅ **先展示流程概览**：让用户了解完整流程
- ✅ **逐个问问题**：每次只问一个问题
- ✅ **固定4个核心问题**：现状痛点、业务流程、业务要素、业务规则
- ✅ **使用 [A] 格式**：让选项可点击
- ✅ **每个选项单独成行**：选项之间空一行，便于阅读
- ✅ **提供"其他"选项**：让用户可以自由输入答案

**WHAT NOT TO DO:**
- ❌ Do NOT output the full draft content to the conversation
- ❌ Do NOT output internal exploration details ("我正在查看XX文档...")
- ❌ Do NOT ask more than 4 questions (固定4个核心问题)
- ❌ Do NOT ask abstract questions
- ❌ Do NOT ask multiple questions at once
- ❌ Do NOT add unnecessary explanatory text ("根据XX技能的要求...")

**After user responds:**
- Update the draft file incrementally after each answer
- Mark confirmed fields as `[用户确认]`
- Other required fields are filled based on AI inference
- After all questions, ask: "是否批准草稿？(是/需要修改)"
</CRITICAL-ORDER>

Iterate based on feedback until approved.

## Step 2.5 — Knowledge Persistence

After user confirms their answers, persist the knowledge to the knowledge base for future inference.

**Knowledge Base Location Detection:**

1. **First**, check if any of these directories exist:
   - `.knowledge/`
   - `knowledge/`
   - `docs/knowledge/`
   - `业务知识/`

2. **If found**: Use the first matching directory as the knowledge base root
3. **If not found**: Create and use `docs/knowledge/` as the knowledge base root

**Document Matching Strategy:**

For each confirmed answer, search for existing documents:

| Knowledge Type | Search Strategy | Document Structure |
|---------------|-----------------|-------------------|
| **现状痛点** | Match by domain keywords (e.g., "订单" → `订单管理.md`) | ## 痛点\n### {场景}\n{内容} |
| **业务流程** | Match by function type keywords | ## 流程\n### {功能}\n{内容} |
| **业务要素** | Match by entity name keywords | ## 业务要素\n### {实体}\n{字段列表} |
| **业务规则** | Match by rule domain keywords | ## 业务规则\n### {规则类型}\n{内容} |

**Update or Create:**

1. **Find matching document**: Search for documents containing relevant keywords in filename or content
2. **If found**:
   - Read the document
   - Check if corresponding section exists (e.g., `## 痛点` or `## 流程`)
   - If section exists: Update the content
   - If section doesn't exist: Insert new section at appropriate location
3. **If not found**: Create new document with standard structure
4. **Add metadata**: Each update includes timestamp and source

**Document Template:**

```markdown
# {文档标题}

> 知识来源：PRD需求收集
> 最后更新：{YYYY-MM-DD HH:mm}

## 痛点

### {场景名称}
- **描述**：{痛点描述}
- **发生频度**：{高频/中频/低频}
- **后果影响**：{影响描述}

## 流程

### {功能名称}
```mermaid
flowchart TD
    {流程图}
```

## 业务要素

### {实体名称}
| 字段名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| {字段} | {类型} | {说明} | {是/否} |

## 业务操作规则

### {规则类型}
- **规则**：{规则描述}
- **适用场景**：{场景}
```

**Example:**

User confirms "订单查询流程" answer:
1. Search for documents containing "订单" keyword
2. If `订单管理.md` exists → read it
3. Check if `## 流程` section exists
4. If yes, check if `### 订单查询` subsection exists
5. If subsection exists: update its content
6. If not: insert new subsection under `## 流程`
7. Update `> 最后更新：` timestamp

## Step 3 — Finalize Document

The draft is already in `{feature-name}-{timestamp}.md`. When approved:

1. **Update the file** with any user-approved changes
2. **Remove draft header** (`<!-- DRAFT VERSION... -->`)
3. **Required Fields Check**: Verify all "必填" fields are complete

**必填字段清单:**
- 1.1 背景和目标
- 2.1 现状业务流程/现状用户旅程/现状业务痛点 (**核心问题**)
- 2.2 未来业务全景/未来业务流程/未来用户旅程
- 2.5 功能清单
- 3.1.1 功能简述
- 3.1.2.1 入口路径
- 3.1.3 流程图 (**核心问题**)
- 3.1.4.1 原型图
- 3.1.6 业务操作规则 (**核心问题**)

**注意**: 3.1.5 业务要素虽为选填，但作为核心数据通常需要确认

## Required Fields Quick Reference

**必填字段清单:**

| 章节 | 字段 | 说明 | 确认方式 |
|-----|------|------|---------|
| 1.1 | 背景和目标 | 简明扼要地描述本需求的核心功能、背景和目标 | AI推断 |
| 2.1 | 现状业务流程/痛点 | 描述用户场景、痛点问题、发生频度、后果影响 | **核心问题** |
| 2.2 | 未来业务流程 | 描述功能实现后的业务流程/用户旅程 | AI推断 |
| 2.5 | 功能清单 | 填写功能列表表格 | AI推断 |
| 3.1.1 | 功能简述 | 简述功能的核心内容 | AI推断 |
| 3.1.2.1 | 入口路径 | 描述功能的菜单路径或访问方式 | AI推断 |
| 3.1.3 | 流程图 | 绘制业务流程图 | **核心问题** |
| 3.1.4.1 | 原型图 | 提供UI原型设计 | AI推断 |
| 3.1.5 | 业务要素 | 核心业务字段（5-10个） | **核心问题**（模板选填，建议确认） |
| 3.1.6 | 业务操作规则 | 描述业务操作规则 | **核心问题** |

**注：**
- 标注"核心问题"的字段需要通过问答确认，其他由AI推断填充
- 3.1.5 业务要素在模板中为选填，但通常需要确认

## Anti-Patterns & Red Flags

| Anti-Pattern | Correct Behavior |
|--------------|------------------|
| ❌ Outputting full draft to conversation | ✅ Write draft to `{name}-{timestamp}.md`, inform user it's saved |
| ❌ Asking questions BEFORE informing about file | ✅ Inform user draft is saved, then present questions |
| ❌ Giving abstract options like "编辑/提供信息/批准" | ✅ Ask specific questions with 2-4 preset options |
| ❌ Confirming all 9+ required fields | ✅ Confirm only 3-5 core questions |
| ❌ Not including AI inference as an option | ✅ AI's inference should be option A |
| ❌ "其他"选项作为预设选项 | ✅ "其他"应让用户直接输入 |
| ❌ Asking 3+ batches of questions | ✅ Generate draft first, ask all core questions at once |
| ❌ Listing 15-30 fields aggressively | ✅ List 5-10 core fields based on actual need |
| ❌ Asking what can be inferred | ✅ Use Step 0 exploration to fill content |
| ❌ Section-by-section validation | ✅ Present full draft, confirm core questions in one round |
| ❌ Writing implementation details | ✅ Focus on what, not how. Leave tech for contract phase |
| ❌ Missing required fields | ✅ Always verify all "必填" fields are complete |
| ❌ Generated without user confirmation | ✅ Always present draft and get confirmation on core questions |
| ❌ More than 4 preset options | ✅ Maximum 4 preset options (A/B/C/D) + "其他" |
