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
| `references/flowchart.md` | 完整流程图 + 脚本职责一览 | 不确定当前步骤/分支时 |

## 执行流程（状态机）

> **规则：每步执行完后，根据末尾的 `→` 指令跳转。遇到 `IF...THEN...ELSE...` 时只走一条分支。**

---

### 入口：就绪检查

**进入条件**: Skill 被触发，且非"检查组件文档是否过时"意图。

---

**0a. 检查清单**

检查 `.ai/project-components/.component-list.json`。

**IF 不存在 → 执行 0b（首次扫描）。**
**IF 存在 → 跳到 0c（展示进度）。**

---

**0b. 首次扫描**

```
node <skill-dir>/scripts/scan-components.mjs <项目根目录>
```

| 参数 | 用途 |
|------|------|
| `<项目根目录>` | 位置参数，默认当前目录 |
| `--dir <path>` | 只扫描指定子目录 |
| `--patterns <p1,p2>` | 自定义 glob 模式 |
| `--output <path>` | 自定义输出路径 |

**脚本输出 "No component files matched any pattern"** → 告知用户，询问 `--dir` 路径后重新执行 0b。

**脚本输出 "WARNING: More than 30 components"** → 告知用户建议缩小范围，询问是否继续。用户说继续 → 沿用结果；用户指定新范围 → 加 `--dir` 重新执行 0b。

**脚本成功** → 进入 0c。

---

**0c. 展示进度**

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

> 若多个组件同名（不同路径），通过 `id` 或 `file` 字段区分显示。

询问用户：**请选择本次处理的优先级：高 / 中 / 低？**

**IF 某个优先级内所有组件 `status` 都不是 `pending`** → 该优先级显示"全部已完成"，不可选。

**IF 所有 `pending` 组件已全部处理完** → 提示"全部完成"，流程结束。

---

**0d. 检查缓存**

检查 `.ai/project-components/.cache/` 下是否存在组件级缓存文件（如 `Button__src-components-Button.json`）。

**IF 存在 → 材料已就绪，直接进入第三步（生成文档）。**

**IF 不存在（目录为空或无 .json 文件） → 进入第二步（准备材料）。**

---

### 第二步：准备材料（条件性）

**进入条件**: 入口 0d 检查发现 `.cache/` 下无组件级缓存文件。

从 `.component-list.json` 中取出该优先级下 `status === "pending"` 的组件列表，记为 `BATCH`。

> 如果 `BATCH` 为空，回到 0c 重新选择。

**执行策略：一次 Bash 完成 Props 提取 + 关联类型 + 使用示例采集 + 合并。需要更新时删掉 `.cache/` 目录重跑即可，不做单个文件断点恢复。**

---

**2a. 运行 prepare 脚本（1 轮）**

```
node <skill-dir>/scripts/prepare.mjs <文件1> <文件2> ... --project-root <项目根目录> --output-dir .ai/project-components/.cache
```

> Bash 参数: `timeout: 300000`（5 分钟）。

传入 BATCH 中所有组件的文件路径，一次调完。脚本内部调度 Props 提取、关联类型搜索、使用示例采集、合并输出。

产出：`.cache/<组件id>.json`（每个组件一个，含 componentName / id / sourceHash / props / referencedTypes / usages）。

脚本通过 react-docgen-typescript (TypeScript Compiler API) 提取 Props，不可用时回退到手工解析。

**等待任务完成** → 检查 `method` 和 `props[].type` 标记：

| 条件 | 标记 |
|------|------|
| `method === "manual-extraction"` 的组件 | 该组件的所有 prop 标 `[? 手工提取，类型待确认]` |
| 单个 prop 的 `type === "any"` 或 `"unknown"` | 标 `[? 类型不明确]` |

---

> 脚本执行完毕 → 进入第三步。

---

### 第三步：逐组件生成文档，每 5 个暂停

**进入条件**: `.cache/` 下存在组件级缓存文件（第二步 produce 产出）。

> 🛑 **阶段二铁律：所有材料都在 .cache/<组件id>.json 里。不读组件源码、不跑脚本、不 Glob/Grep 项目目录。每个组件只读一个文件。**

**核心规则：一次只处理一个组件。写入并验证通过后再开始下一个。不批量创建目录、不批量写入。**

**初始化计数器 `N = 0`。**

---

#### 处理单个组件的流程

对当前组件，严格按顺序执行 3a → 3b → 3c → 3d。**走完一个组件再走下一个。**

---

**3a. 读取该组件的缓存**

`Read` `.cache/<组件id>.json`（id 从 `.component-list.json` 对应条目中获取）。

该文件包含 componentName、id、sourceHash、props、referencedTypes、usages。一次读取，全部数据到位。

---

**3b. 推导 metadata**

从缓存数据推导，按以下模板逐项填空：

```
useWhen:     [从 usages 的使用场景 + props 接口用一句业务语言描述]
dontUseWhen: [从 usages 覆盖不到的场景反推。没有就写"暂未发现排除场景"]
prefer:      [从 referencedTypes 的类型名搜同目录下有无类似组件名。没有就写"暂未发现替代方案"]
```

不知道就写固定话术，不要编造。每项前面标 `[? 待确认]`。

---

**3c. 获取 sourceHash**

从 3a 读取的 JSON 中取 `sourceHash` 字段。

---

**3d. 生成并写入文件**

按 `references/output-format.md` 中的模板生成内容，写入以下两个文件：

1. `Write` `.ai/project-components/components/<组件id>/index.md`
2. `Write` `.ai/project-components/components/<组件id>/metadata.json`

**写入后立即验证：用 `Read` 读取刚写入的两个文件，确认内容非空且格式正确。如果任一文件为空或读取失败，重新写入该文件。验证通过后 `N += 1`。**

---

**3e. 判断下一步**

- **IF `N < 5` 且 BATCH 中还有剩余组件** → 回到 3a，处理下一个组件。
- **IF `N === 5` 或 BATCH 处理完毕** → 暂停，汇报本批摘要（见下方模板），等待用户确认。

---

**暂停汇报模板（`N === 5` 或 BATCH 完成时使用）：**

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

- `IF BATCH 中还有剩余组件 → 继续从 3a 处理下一个。`
- `IF BATCH 全部完成 → 进入第四步。`

**收到修改意见 → 先修改对应文件，然后 `N -= 1`（本次暂停的批次仍算已处理），询问"继续？"**

---

### 第四步：收尾

**进入条件**: BATCH 中所有组件已处理完毕且用户确认。

1. 更新 `.component-list.json`：将本批次已处理组件的 `status` 改为 `"done"`（通过 `id` 定位条目）
2. 更新 `.ai/project-components/README.md` 索引
3. 输出汇总：

```
本批次完成 X 个组件：UserTable, SearchForm, ...

标了 [?] 的 metadata 项（建议人工复核）：
  - UserTable: dontUseWhen — "空数据时是否用 Empty 替代？"
  - SearchForm: useWhen — 推测为"搜索场景"，请确认

总进度：M / N（高优 M1/N1, 中优 M2/N2, 低优 M3/N3）
```

**→ 流程结束。** 下次新建任务触发本 skill，从入口 0a 继续处理剩余组件。

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

共 N 个组件：X 个一致，Y 个可能过时。建议对过时组件重新执行准备材料和生成文档步骤。
```

> 此检测只读不写，零风险。

---

## 验证清单

- [ ] 入口 0b 已执行 `scan-components.mjs`，脚本成功输出 `.component-list.json`
- [ ] 脚本输出 "No component files matched" 时，已询问用户指定 `--dir`
- [ ] 脚本输出 "More than 30 components" 时，已建议缩小范围
- [ ] 第二步 2a 已执行 `prepare.mjs`（一次 Bash），产出 `.cache/<组件id>.json`
- [ ] `method: "manual-extraction"` 的 props 已全部标 `[? 手工提取，类型待确认]`
- [ ] 第三步逐组件处理，每个组件写入后立即 Read 验证文件非空
- [ ] 未批量创建目录或批量写入——每个组件独立闭环
- [ ] `N === 5` 或批次完成时已暂停汇报，等待用户确认
- [ ] 每个组件目录下都有 `index.md` 和 `metadata.json`，内容非空
- [ ] `.component-list.json` 中已完成组件的 status 已更新为 `"done"`
- [ ] README.md 索引覆盖所有已处理组件
- [ ] 每个 .md 格式严格按 `references/output-format.md` 模板
- [ ] dontUseWhen 每条给出了替代方案
- [ ] 每个组件至少 2 个来自真实代码的使用示例，标注了来源路径（从 `.cache/<组件id>.json` 的 usages 中筛选）
- [ ] Props 注释符合 `references/jsdoc-guidelines.md` 规范
