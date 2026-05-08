---
name: component-ai-docs
description: "盘活项目中的存量业务组件，让 AI 认识它们。自动扫描组件清单、深度搜集类型定义和真实使用案例、生成 AI 可消费的标准文档。触发词：组件文档、AI组件文档、盘活组件、提取组件API、让AI认识组件、component docs for AI、项目组件文档。"
---

# Component AI Docs

> 盘活项目中的业务组件——让 AI 认识你项目里那些没有文档的存量组件。

**核心问题**: AI 写前端代码时，不知道项目里有哪些业务组件、接受什么 Props、什么时候该用什么时候不该用。

**解决思路**: 通过脚本扫描 + 深度搜集 + 真实使用案例，生成 AI 可消费的标准文档。高频组件优先，分批推进。

## 核心原则

1. **开发者最了解组件。** `metadata.json` 里的"何时用/何时不用"只有人能写对——Skill 的角色是引导写出来，不是替代判断。
2. **JSDoc 写给人看的不等于写给 AI 看的。** "用户名称"是给人看的，"必填，用于表格列渲染和搜索条件"是给 AI 看的。
3. **先盘核心，再补全量。** 20 个组件里高频使用的可能就 10 个，优先盘活这几个。
4. **真实案例胜过编造示例。** 项目里已有大量使用案例，搜集它们比 AI 编造示例更有价值。

## 参考文档

> 以下规范文件在相关步骤中会被引用，按需读取。

| 文件 | 内容 | 何时读 |
|------|------|--------|
| `references/output-format.md` | 目录结构、.md 模板、metadata.json 规范 | 第三步生成文件时 |
| `references/jsdoc-guidelines.md` | JSDoc 写法规范 | 第三步写 Props 注释时 |

## 执行流程（状态机）

> **规则：每步执行完后，根据末尾的 `→` 指令跳转。遇到 `IF...THEN...ELSE...` 时只走一条分支。不自行判断流程。**

---

### 第一步：获取组件清单

**进入条件**: Skill 被触发，且非"检查组件文档是否过时"意图。

**1a. 检查清单是否存在**

检查 `.ai/project-components/.component-list.json`。

**IF 不存在 → 执行 1b（首次扫描）。**

**IF 存在 → 执行 1c（展示进度）。**

---

**1b. 首次扫描（运行脚本）**

```
node <skill-dir>/scripts/scan-components.mjs <项目根目录>
```

脚本参数：

| 参数 | 用途 |
|------|------|
| `<项目根目录>` | 位置参数，默认当前目录 |
| `--dir <path>` | 只扫描指定子目录 |
| `--patterns <p1,p2>` | 自定义 glob 模式 |
| `--output <path>` | 自定义输出路径 |

**脚本输出 "No component files matched any pattern"** → 告知用户，询问 `--dir` 路径后重新执行，然后回到本步开头。

**脚本输出 "WARNING: More than 30 components"** → 告知用户建议缩小范围，询问是否继续。用户说继续 → 沿用结果；用户指定新范围 → 加 `--dir` 重新执行。

**脚本成功** → 自动进入 1c。

---

**1c. 展示进度**

读取 `.component-list.json`。状态符号：`✅`=done, `⬜`=pending, `⏭️`=skipped, `🚫`=deprecated。

```
组件清单（2024-01-15 创建）：

=== 高优先级（10 个）===
  ✅ UserTable        — 已完成
  ⬜ SearchForm       — 未处理
  ⬜ DataTable        — 未处理
  🚫 OldModal         — 已废弃

=== 中优先级（8 个）===
  ⬜ StatusBadge
  ⏭️ TagList          — 已跳过

=== 低优先级（7 个）===
  ⬜ OldReport
  ...

已完成 1/20，已跳过 1，已废弃 1。
```

询问用户：**请选择本次处理的优先级：高 / 中 / 低？**

**IF 某个优先级内所有组件 `status` 都不是 `pending`** → 该优先级显示"全部已完成"，不可选。

**IF 所有 `pending` 组件已全部处理完** → 提示"全部完成"，流程结束。

> 用户选择后 → 进入第二步。

---

### 第二步：批量搜集数据（3 轮脚本）

**进入条件**: 用户已选择优先级（高/中/低）。

从 `.component-list.json` 中取出该优先级下 `status === "pending"` 的组件列表，记为 `BATCH`。

> 如果 `BATCH` 为空，回到第一步 1c 重新选择。

**断点恢复：每个脚本将结果写入 `.ai/project-components/.cache/`。执行前先检查缓存文件是否存在：**

| 缓存文件 | 对应脚本 | 已存在则跳过 |
|----------|---------|------------|
| `.cache/props.json` | 2a | ✅ 跳过 |
| `.cache/types.json` | 2b | ✅ 跳过 |
| `.cache/usages.json` | 2c | ✅ 跳过 |

> 如果某个脚本中断（Bash 报错且缓存文件为空/不存在），重新执行该脚本即可，前面的缓存文件不受影响。

**脚本启动时自动探测一次 react-docgen 可用策略，之后全量复用。18 个组件通常在 30-60s 内完成。**

---

**2a. 批量提取 Props（1 轮）**

```
node <skill-dir>/scripts/extract-props.mjs <文件1> <文件2> ... --project-root <项目根目录> --output .ai/project-components/.cache/props.json
```

> Bash 参数: `timeout: 300000`（5 分钟）。结果同时写入文件和 stdout。

传入 BATCH 中所有组件的文件路径，一次调完。进度输出在 stderr，JSON 结果在 stdout。每个组件独立 try/catch，一个报错不影响其他。

**等待后台任务完成** → 读取 stdout 的 JSON 数组，按以下规则标记：

| 条件 | 标记 |
|------|------|
| `success: true` + `method !== "manual-extraction"` | 类型可信，直接用 |
| `success: false` 或 `method === "manual-extraction"` | 所有 prop 标 `[? 手工提取，类型待确认]` |
| 单个 prop 的 `type === "any"` 或 `"unknown"` | 标 `[? 类型不明确]` |

---

**2b. 搜索关联类型（1 轮）**

```
node <skill-dir>/scripts/extract-types.mjs <文件1> <文件2> ... --project-root <项目根目录> --output .ai/project-components/.cache/types.json
```

> Bash 参数: `timeout: 120000`。

同样传入 BATCH 中所有组件的文件路径，一次调完。

脚本自动完成：读取每个组件的 Props → 提取类型中的 PascalCase 标识符 → 全项目搜索 `interface X` / `type X` 定义 → 输出定义块。

读取 stdout 的 JSON，每个组件得到 `referencedTypes` 数组，供第三步填入"组合组件引用"。

---

**2c. 采集使用示例（1 轮）**

```
node <skill-dir>/scripts/collect-usages.mjs <CompA> <CompB> ... --project-root <项目根目录> --output-dir .ai/project-components/.cache/usages
```

> Bash 参数: `timeout: 120000`。传入 BATCH 中所有组件的**名称**（不是文件路径）。

脚本按组件拆分输出，避免单个大 JSON 撑爆上下文：
- `.cache/usages/CompA.json` — 每个组件一个文件，包含 `usages` 数组
- stdout — 只输出摘要（组件名 → 使用次数）
- stderr — 进度日志

第三步处理单个组件时，直接 `Read .cache/usages/<组件名>.json` 获取该组件的使用示例。

---

> 三个脚本全部执行完毕 → 进入第三步。

---

### 第三步：逐组件生成文档，每 10 个暂停

**进入条件**: 第二步的 2a/2b/2c 全部完成（`.cache/` 下三个文件均存在）。

**数据来源**：从缓存文件按需读取，不依赖 AI 上下文：

| 数据 | 文件 | 读取方式 |
|------|------|---------|
| Props 类型 | `.cache/props.json` | Read 全文，从数组中取 `componentName` 匹配项 |
| 关联类型 | `.cache/types.json` | 同上 |
| 使用示例 | `.cache/usages/<组件名>.json` | Read 单个组件文件，直接获取 |

**初始化计数器 `N = 0`。**

对 `BATCH` 中每个组件，依次执行 3a → 3b → 3c。每处理完一个组件 `N += 1`。

**IF `N < 10` 且 BATCH 中还有剩余组件 → 继续处理下一个。**

**IF `N === 10` 或 BATCH 处理完毕 → 暂停，汇报本批摘要（见下方模板），等待用户确认。**

---

**3a. 推导 metadata**

按以下模板逐项填空，不知道就写固定话术，不要编造：

```
useWhen:     [看组件源码核心逻辑，用一句业务语言描述]
dontUseWhen: [看源码条件分支——什么情况不渲染/返回 null？没有就写"暂未发现排除场景"]
prefer:      [搜项目中有无类似组件，没有就写"暂未发现替代方案"]
```

每项前面标 `[? 待确认]`。

---

**3b. 计算 sourceHash**

```
node -e "const c=require('crypto'),f=require('fs');console.log(c.createHash('sha256').update(f.readFileSync(process.argv[1])).digest('hex'))" <组件文件路径>
```

---

**3c. 保存文件**

按 `references/output-format.md` 中的模板生成并写入：

- `.ai/project-components/components/<组件名>/index.md`
- `.ai/project-components/components/<组件名>/metadata.json`

保存后不等待，`N += 1`，立即处理下一个。

---

**暂停汇报模板（`N === 10` 或 BATCH 完成时使用）：**

```
完成第 X-Y 个组件，metadata 摘要：

1. UserTable    useWhen: "管理后台列表页（搜索+表格+分页）" [? 待确认]
                dontUseWhen: "纯展示无搜索 → 直接用 STable" [? 待确认]
2. StatusBadge  useWhen: "需要按状态显示不同颜色标签的场景" [? 待确认]
                dontUseWhen: "暂未发现排除场景" [? 待确认]
...

以上需要修改吗？输入序号+修改内容，或输入"继续"。
```

**收到"继续" → 重置 `N = 0`：**

- `IF BATCH 中还有剩余组件 → 继续处理下一个。`
- `IF BATCH 全部完成 → 进入第四步。`

**收到修改意见 → 先修改对应文件，然后 `N -= 1`（本次暂停的批次仍算已处理），询问"继续？"**

---

### 第四步：收尾

**进入条件**: BATCH 中所有组件已处理完毕且用户确认。

1. 更新 `.component-list.json`：将本批次已处理组件的 `status` 改为 `"done"`
2. 更新 `.ai/project-components/README.md` 索引
3. 输出汇总：

```
本批次完成 X 个组件：UserTable, SearchForm, ...

标了 [?] 的 metadata 项（建议人工复核）：
  - UserTable: dontUseWhen — "空数据时是否用 Empty 替代？"
  - SearchForm: useWhen — 推测为"搜索场景"，请确认

总进度：M / N（高优 M1/N1, 中优 M2/N2, 低优 M3/N3）
```

**→ 流程结束。** 下次新建任务触发本 skill，从第一步 1a 继续处理剩余组件。

---

## 文档保鲜：检测过时文档

> **独立流程。** 仅当用户说"检查组件文档是否过时"或"更新组件文档"时执行，跳过了上述四步流程。

1. 读取 `.ai/project-components/components/*/metadata.json`，提取每个组件的 `sourceHash` 和源文件路径
2. 对每个源文件执行 hash 比对：
   ```
   node -e "const c=require('crypto'),f=require('fs');console.log(c.createHash('sha256').update(f.readFileSync(process.argv[1])).digest('hex'))" <源文件路径>
   ```
3. 输出差异清单：

```
文档保鲜检测：
  ✅ UserTable     — 文档与源码一致
  ❌ StatusBadge   — 源码已变更（旧 hash: a1b2..., 新 hash: e5f6...），文档可能过时
  ✅ DataChart     — 文档与源码一致

共 N 个组件：X 个一致，Y 个可能过时。建议对过时组件重新执行第二步和第三步。
```

> 此检测只读不写，零风险。

---

## 验证清单

- [ ] 第一步已执行 `scan-components.mjs`，脚本成功输出 `.component-list.json`
- [ ] 脚本输出 "No component files matched" 时，已询问用户指定 `--dir`
- [ ] 脚本输出 "More than 30 components" 时，已建议缩小范围
- [ ] 第二步 2a 已批量执行 `extract-props.mjs`（一次 Bash），检查了每个组件的 `success` 和 `method`
- [ ] 第二步 2b 已批量执行 `extract-types.mjs`（一次 Bash）
- [ ] 第二步 2c 已批量执行 `collect-usages.mjs`（一次 Bash）
- [ ] `method: "manual-extraction"` 的 props 已全部标 `[? 手工提取，类型待确认]`
- [ ] 第三步逐组件处理，处理完立即保存
- [ ] `N === 10` 或批次完成时已暂停汇报，等待用户确认
- [ ] 每个组件目录下都有 `index.md` 和 `metadata.json`
- [ ] `.component-list.json` 中已完成组件的 status 已更新为 `"done"`
- [ ] README.md 索引覆盖所有已处理组件
- [ ] 每个 .md 格式严格按 `references/output-format.md` 模板
- [ ] dontUseWhen 每条给出了替代方案
- [ ] 每个组件至少 2 个来自真实代码的使用示例，标注了来源路径（从 `collect-usages.mjs` 输出的素材中筛选）
- [ ] Props 注释符合 `references/jsdoc-guidelines.md` 规范
