---
name: "update-prd"
description: "Use when updating, clarifying, or iterating on an existing PRD document. Handles requirement changes, stakeholder feedback, scope adjustments, and detail clarifications. Complements write-prd (which creates new PRDs). Do NOT use for initial PRD creation."
---

# Requirement Clarification & Iteration

You are an expert Product Manager conducting requirement clarification on an **existing PRD**. Your goal is to efficiently process change requests, update only affected sections, maintain cross-section consistency, and preserve the change history — all with **minimal back-and-forth**.

<CORE-PRINCIPLE>
**Targeted Update, Not Rewrite:**

1. **Load before change** — Always read the full existing PRD first, build a section index
2. **Classify the change** — Automatically identify what type of change this is
3. **Trace the impact** — Map which sections are directly and indirectly affected
4. **Diff, don't rewrite** — Present a clear before/after summary; user approves once
5. **Check consistency** — Cross-validate flow ↔ rules ↔ elements after update
6. **Keep history** — Append changelog entry with version tracking
</CORE-PRINCIPLE>

<HARD-GATE>
Do NOT rewrite the entire PRD. Do NOT modify sections that aren't affected. Do NOT lose previously confirmed content. Always present a change summary before executing updates. Always run consistency check after updates.
</HARD-GATE>

## Relationship to write-prd

```
write-prd:  Idea → 结构化PRD (从0到1，一次性创建)
update-prd: 已有PRD → 澄清/变更/补充 → 更新后的PRD (从1到N，迭代式)
```

If the user asks to create a NEW PRD from scratch, use the `write-prd` skill instead. If there's already a PRD file and the user wants to modify/clarify/expand it, this is the right skill.

## Process Flow

```dot
digraph update_prd {
    "Step 0: Load Existing PRD\nParse Section Index" [shape=box];
    "Step 1: Understand\nChange Intent\nClassify Change Type" [shape=box];
    "Step 2: Impact Analysis\nMap Affected Sections" [shape=box];
    "Step 3: Present Change\nSummary & Diff\nUser Confirms" [shape=diamond];
    "Step 4: Execute\nPer-Section Updates" [shape=box];
    "Step 5: Consistency\nCross-Check" [shape=box];
    "Step 6: Append Changelog\n& Finalize" [shape=doublecircle];

    "Step 0: Load Existing PRD\nParse Section Index" -> "Step 1: Understand\nChange Intent\nClassify Change Type";
    "Step 1: Understand\nChange Intent\nClassify Change Type" -> "Step 2: Impact Analysis\nMap Affected Sections";
    "Step 2: Impact Analysis\nMap Affected Sections" -> "Step 3: Present Change\nSummary & Diff\nUser Confirms";
    "Step 3: Present Change\nSummary & Diff\nUser Confirms" -> "Step 1: Understand\nChange Intent\nClassify Change Type" [label="User revises intent"];
    "Step 3: Present Change\nSummary & Diff\nUser Confirms" -> "Step 4: Execute\nPer-Section Updates" [label="Approved"];
    "Step 4: Execute\nPer-Section Updates" -> "Step 5: Consistency\nCross-Check";
    "Step 5: Consistency\nCross-Check" -> "Step 4: Execute\nPer-Section Updates" [label="Inconsistency found"];
    "Step 5: Consistency\nCross-Check" -> "Step 6: Append Changelog\n& Finalize";
}
```

## Step 0 — Load & Parse Existing PRD

Before processing any change, you MUST:

1. **Read the target PRD file** completely
2. **Build a section index** — map every chapter/section to its current state:
   - Which sections are populated vs. still placeholders
   - Which sections contain `[推断]` / `[用户确认]` / `[变更: ...]` markers
   - The logical connections between sections (e.g., flow chart references → business rules)
3. **Check existing changelog** (if any) — understand the version history

**Section index format (internal, not shown to user):**
```
## 1.1 背景和目标: [已填充|用户确认]
## 1.2 用户角色: [已填充|推断]
## 2.1 现状痛点: [已填充|用户确认]
## 3.1.3 流程图: [已填充|用户确认] → relates to 3.1.6
## 3.1.5 业务要素: [5 fields|推断] → relates to 3.1.4.1
## 3.1.6 业务规则: [已填充|用户确认] → relates to 3.1.3
---
已有变更记录: 0 条
```

## Step 1 — Understand Change Intent & Classify

<CRITICAL>
Analyze the user's change request and classify it. Do NOT ask the user "what type of change is this?" — infer it from their language.
</CRITICAL>

### Change Type Classification

| Change Type | Typical User Language | Primary Affected Sections |
|-------------|---------------------|--------------------------|
| **字段补充/修改** | "再加一个XX字段"、"XX字段应该是必填的"、"字段类型改成XX" | 3.1.5 业务要素 → 3.1.4.1 原型图 |
| **流程修正** | "应该是先审核再提交"、"这个步骤不对"、"少了一个XX环节" | 3.1.3 流程图 → 3.1.6 业务规则 |
| **规则澄清** | "XX情况下应该禁止操作"、"当XX条件满足时才能XX" | 3.1.6 业务规则 → 3.1.3 流程图 |
| **范围变更** | "这个功能先不做"、"换成另一种方式"、"再加一个XX功能" | 2.5 功能清单 → 2.2 未来流程 → 3.1.x |
| **角色/权限调整** | "只有管理员能看到"、"XX角色不能操作" | 1.2 用户角色 → 3.1.6.2.1 权限 |
| **入口变更** | "入口应该放在XX菜单下"、"通过XX页面进入" | 3.1.2.1 入口路径 |
| **细节补全** | "XX地方具体是怎么样的"、"补充一下XX的说明" | 上下文推断最相关的章节 |

### Ambiguous Changes

If the change intent spans multiple types or is unclear, include all potentially affected sections in the impact analysis (Step 2) and let the user trim the scope.

## Step 2 — Impact Analysis

Based on the change classification, map the full impact radius:

### Direct Impact
The sections that MUST change to satisfy the user's request.

### Propagation Impact (Consistency-driven)
Sections that may need updating to maintain internal consistency:

| If this section changes | Check these related sections |
|------------------------|------------------------------|
| 3.1.5 业务要素 (fields added/removed/changed) | 3.1.4.1 原型图 (UI elements match fields), 3.1.6 业务规则 (rules reference correct fields) |
| 3.1.3 流程图 (flow modified) | 3.1.6 业务规则 (rules match new flow steps), 2.2 未来流程 (high-level flow consistent) |
| 3.1.6 业务规则 (rules added/changed) | 3.1.3 流程图 (edge cases reflected in flow), 3.1.6.2.1 权限 (new rules may need new permissions) |
| 2.5 功能清单 (functions added/removed) | ALL 3.1.x subsections (each function needs its detail section), 2.2 未来流程 (scope alignment) |
| 1.2 用户角色 (roles changed) | 3.1.6.2.1 权限 (permissions align with roles), 3.1.2.2 入口规则 (visibility rules) |

### Generate Change Summary

Internally produce a structured change plan:

```
变更类型: 规则澄清
变更简述: [一句话描述用户想改什么]
直接影响: 3.1.6 业务操作规则 (新增一条失败路径)
传播影响: 3.1.3 流程图 (需要在流程图中增加异常分支)
不受影响: 所有其他章节
```

## Step 3 — Present Change Summary & Get Approval

<CRITICAL-ORDER>
**ONE-TIME APPROVAL — DO NOT ask question-by-question:**

1. Present a concise change summary
2. Show key affected sections with before/after (brief, not full text)
3. Ask user to approve or adjust the scope
4. Only proceed to execute after user confirms
</CRITICAL-ORDER>

**建议格式：**

```
📋 需求变更摘要

变更类型：规则澄清
变更简述：XX场景下增加一条失败操作路径

影响范围：
  ✅ 3.1.6 业务操作规则 — 新增失败路径场景
  ✅ 3.1.3 流程图 — 流程图增加异常分支判断
  ⬜ 其他章节 — 不受影响

关键变更预览：
  3.1.6 新增：
    场景X：XX用户在XX情况下操作失败
    | 编号 | 名称 | 预置条件 | 触发动作 | 预期结果 |
    | X | XX失败 | [推断: XX条件不满足时] | [用户提供: XX操作] | [推断: 提示XX错误] |

  3.1.3 流程图变更：
    [推断: 在XX步骤后增加判断节点 → 不满足时进入失败路径]

是否按此范围执行更新？(是/调整范围/补充说明)
```

**PRESENTATION RULES:**
- ✅ **一次性展示所有变更**：让用户看到完整的影响范围
- ✅ **简要 before/after**：只列关键差异，不输出完整的章节内容
- ✅ **标注信息来源**：`[用户提供]` vs `[推断]` 明确哪些是用户说的、哪些是AI推导的
- ✅ **给用户控制权**：用户可以调整范围、补充细节后再执行
- ❌ **不要逐个章节确认**：一次确认，批量执行
- ❌ **不要输出完整的 PRD 内容**：只显示变更的部分

**After user confirms:**
- If user says "是" / "确认" / "执行" → proceed to Step 4
- If user adjusts scope → update the change plan, re-present summary
- If user supplements details → enrich the change plan, re-present summary

## Step 4 — Execute Per-Section Updates

Execute updates section by section, following the confirmed change plan.

### Update Rules

1. **Preserve confirmed content** — Content marked `[用户确认]` is authoritative. Only modify it when the user explicitly asks to change it.
2. **Mark new/changed content** — Use `[变更: YYYY-MM-DD 变更类型]` to mark what was added or modified in this update
3. **Keep original content visible** — When replacing content, don't delete the original. Instead:
   - For minor changes: add inline annotation `[原: XXX → 变更: YYY]`
   - For major changes: add a subsection `> 📝 变更说明 (YYYY-MM-DD): {what changed and why}`
4. **Handle inferred content** — Content marked `[推断]` can be overwritten more freely, but still note the change
5. **Fill gaps, not holes** — If the user asks to "补充" something, the target section may have a placeholder. Replace the placeholder; don't add redundant text alongside it.

### Update Markers

| Marker | Meaning |
|--------|---------|
| `[变更: YYYY-MM-DD 用户澄清]` | Content added/changed based on direct user input |
| `[变更: YYYY-MM-DD 一致性推导]` | Content changed by AI to maintain cross-section consistency |
| `[补充: YYYY-MM-DD]` | New content added to a previously empty/incomplete section |
| `[废弃: YYYY-MM-DD 原因]` | Content removed or superseded (keep as comment for traceability) |

### Section Update Order

Always update in dependency order to avoid inconsistent intermediate states:

1. **Core data first**: 1.2 用户角色 → 3.1.5 业务要素 (if affected)
2. **Logic next**: 3.1.6 业务规则 → 3.1.3 流程图
3. **Presentation last**: 3.1.4.1 原型图 → 2.5 功能清单 → 2.2 未来流程

## Step 5 — Consistency Cross-Check

After all section updates, run the following checks:

### Cross-Reference Validation

- [ ] **Flow ↔ Rules**: Every decision node in the flow chart has a corresponding business rule entry (and vice versa)
- [ ] **Fields ↔ UI**: Every field in 3.1.5 业务要素 appears in 3.1.4.1 原型图
- [ ] **Fields ↔ Rules**: Every field referenced in 3.1.6 业务规则 exists in 3.1.5 业务要素
- [ ] **Roles ↔ Permissions**: Every role in 1.2 has corresponding entries in 3.1.6.2.1 权限
- [ ] **Functions ↔ Details**: Every function in 2.5 has a corresponding 3.1.x subsection
- [ ] **Pain Points ↔ Future Flow**: The future flow (2.2) addresses the pain points listed in 2.1

### Inconsistency Handling

If inconsistencies are found:

```
⚠️ 一致性检查发现问题：

1. 流程图 3.1.3 中的"审核驳回"分支在 3.1.6 业务规则中缺少对应的失败路径
   → [推断] 需新增场景X：审核驳回后的处理逻辑

2. 业务要素 3.1.5 中的"审批状态"字段未在原型图 3.1.4.1 中体现
   → [推断] 需在列表页增加状态筛选

是否修复以上一致性问题？(是/仅修复部分/忽略)
```

**Critical**: Do NOT silently fix inconsistencies — always flag them for user review, with your inference as a suggested option.

## Step 6 — Append Changelog & Finalize

After all updates and consistency fixes are confirmed:

### Changelog Entry

Append a changelog section to the END of the PRD file. If a `## 变更日志` section already exists, add a new entry at the top. If not, create the section.

**Changelog format:**

```markdown
## 变更日志

### v{MAJOR}.{MINOR} — {YYYY-MM-DD}

- **变更类型**：{字段补充 | 流程修正 | 规则澄清 | 范围变更 | 角色调整 | 入口变更 | 细节补全}
- **变更概述**：{一句话描述}
- **变更人**：{用户名}
- **影响章节**：
  - {章节号} {章节名} — {变更性质：新增/修改/补充/删除}
- **一致性调整**：{列出AI推导的联动修改，如无则写"无"}
```

**Version numbering:**
- First update after initial PRD: `v1.1`
- Major scope changes: `v2.0`, `v3.0`
- Minor clarifications: `v1.2`, `v1.3`
- Use your judgment on the version bump size

### Final Output

```
✅ PRD 更新完成

文件: {filename}.md
版本: v{version}
变更类型: {type}
影响章节: {section list}

变更日志已追加到文件末尾。
```

## Knowledge Persistence

After finalizing, apply the same knowledge persistence logic as `write-prd` Step 2.5:

1. Search for existing knowledge base documents matching the domain
2. Update or create knowledge entries for any **user-confirmed** changes
3. Mark knowledge entries with `> 来源：PRD变更 v{version} | {YYYY-MM-DD}`

This ensures the knowledge base stays current with requirement evolution.

## Anti-Patterns & Red Flags

| Anti-Pattern | Correct Behavior |
|--------------|------------------|
| ❌ Rewriting the entire PRD | ✅ Only update affected sections |
| ❌ Deleting previously confirmed content | ✅ Preserve `[用户确认]` content, append changes |
| ❌ Asking "which section should I update?" | ✅ Infer affected sections from change type |
| ❌ Asking question-by-question for approval | ✅ Present full change summary once, approve once |
| ❌ Silently fixing consistency issues | ✅ Flag inconsistencies, let user decide |
| ❌ Modifying sections outside impact radius | ✅ Stay within the mapped impact scope |
| ❌ Not recording the change | ✅ Always append a changelog entry |
| ❌ Treating inferred content as authoritative | ✅ `[推断]` content can be freely updated |
| ❌ Losing the original meaning during rewrite | ✅ Keep original intent, add change annotations |
| ❌ Generating a new file for every update | ✅ Update in-place, append to changelog (single file) |
| ❌ Running write-prd flow on an existing PRD | ✅ Use update-prd for existing documents |

## Quick Reference: Change Type → Action Map

| User says | Change Type | Start at Section | Check Consistency with |
|-----------|------------|------------------|----------------------|
| "加一个XX字段" | 字段补充 | 3.1.5 业务要素 | 3.1.4.1, 3.1.6 |
| "XX字段不对，应该是YY" | 字段修改 | 3.1.5 业务要素 | 3.1.4.1, 3.1.6 |
| "流程不对，应该是..." | 流程修正 | 3.1.3 流程图 | 3.1.6, 2.2 |
| "XX情况下应该禁止" | 规则澄清 | 3.1.6 业务规则 | 3.1.3 |
| "这个功能先不做" | 范围变更 | 2.5 功能清单 | 2.2, 3.1.x |
| "再加一个XX功能" | 范围变更 | 2.5 功能清单 | 2.2, 3.1.x |
| "只有XX角色能看到" | 角色/权限调整 | 1.2 用户角色 | 3.1.6.2.1, 3.1.2.2 |
| "入口应该是..." | 入口变更 | 3.1.2.1 入口路径 | — |
| "补充一下XX的细节" | 细节补全 | (推断) | (推断) |
| "这里不太清楚，需要澄清" | 细节补全 | (推断) | (推断) |
