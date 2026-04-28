# Agent Skills

个人 AI Agent 技能库，收录用于增强 AI 编程助手能力的自定义技能（Skills）。

每个技能以独立目录组织，包含 `SKILL.md` 主文件及可选的 `references/`、`scripts/` 辅助资源。

## 技能清单

| 技能 | 说明 | 触发词示例 |
|------|------|-----------|
| [component-ai-docs](component-ai-docs/) | 让 AI 认识你的组件——不管来自 npm 包还是历史项目的存量代码。两条路线：(A) 为新组件库生成 AI 可消费文档并打包进 npm；(B) 盘活历史项目的存量组件 | 组件文档、AI组件文档、组件库文档、盘活组件、提取组件API、让AI认识组件 |
| [editorial-deck-design](editorial-deck-design/) | 顶尖创意热店级 PPT 视觉提案排版，以全球顶尖创意热店的视觉水准生成幻灯片排版指令，消除模板感与 AI 塑料感 | PPT 排版、视觉提案、幻灯片设计 |
| [vue-doc-extractor](vue-doc-extractor/) | 从 Vue 3 页面组件中提取框架无关的产品文档，支持查询列表、表单、详情页、审批流、整模块等场景 | 提取文档、vue文档提取、模块文档提取 |
| [red-team-arch-advisor](red-team-arch-advisor/) | 架构对抗顾问，用真实行业案例挑战设计方案，拓宽架构视野，提供针对性辅导建议 | 架构评审、架构挑战、红队审查、技术方案评审 |
| [baby-product-advisor](baby-product-advisor/) | 科学育儿消费决策助手，帮助新手父母理性判断母婴产品是否需要买、买哪个、有无平替、是否安全 | 待产包、需要买什么、新生儿囤货、智商税、母婴税、安全吗、二手、闲鱼、坐月子 |
| [write-prd](write-prd/) | 需求工程技能，将用户想法转化为结构化 PRD 文档。智能推断 + 核心问题确认，最小化交互次数 | PRD、产品需求文档、需求分析、需求规格、写需求 |
| [update-prd](update-prd/) | 需求澄清与迭代更新技能，对已有 PRD 进行变更、补充、澄清。影响范围分析 + 一致性校验 + 变更日志追踪 | 更新PRD、需求变更、需求澄清、需求迭代、修改需求、补充需求 |

## 目录结构

```
agent-skills/
├── component-ai-docs/
│   └── SKILL.md                 # 组件 AI 文档化技能
├── editorial-deck-design/
│   └── SKILL.md                 # PPT 视觉提案排版技能
├── vue-doc-extractor/
│   ├── SKILL.md                 # Vue 文档提取技能
│   ├── references/              # 场景指南与模式识别参考
│   │   ├── patterns-core.md         # 通用代码模式识别
│   │   ├── patterns-antd.md         # Ant Design Vue 组件模式
│   │   ├── patterns-element.md      # Element Plus 组件模式
│   │   ├── patterns-ui-mapping.md   # 通用 UI 术语映射表
│   │   ├── patterns-output-spec.md  # 框架无关输出规范
│   │   ├── scenario-query-list.md   # 查询列表场景指南
│   │   ├── scenario-form.md         # 表单场景指南
│   │   ├── scenario-detail-page.md  # 详情页场景指南
│   │   ├── scenario-approval-flow.md# 审批流场景指南
│   │   └── scenario-module.md       # 模块级提取指南
│   └── scripts/
│       └── detect-ui-lib.sh         # UI 组件库检测脚本
└── red-team-arch-advisor/
    ├── SKILL.md                 # 红队架构顾问技能
    └── references/
        ├── search-strategies.md     # 活水检索策略手册
        └── industry-cases.md        # 行业案例速查弹药库
└── baby-product-advisor/
    ├── SKILL.md                 # 科学育儿消费决策助手
    └── references/
        ├── stage-checklist.md       # 分阶段必需品清单
        ├── safety-standards.md      # GB标准 + 有害成分黑名单
        ├── scam-tax-list.md         # 智商税避坑清单
        ├── secondhand-guide.md      # 二手安全分级指南
        ├── seasonal-guide.md        # 7月夏季宝宝季节适配
        └── budget-framework.md      # 预算规划框架
├── write-prd/
│   ├── SKILL.md                 # 需求工程：结构化 PRD 创建
│   └── assets/
│       └── prd-template.md      # 通用需求解析模板
└── update-prd/
    └── SKILL.md                 # 需求澄清：PRD 迭代更新与变更追踪
```

## 使用方式

将本仓库克隆到本地后，在 Qoder 等支持 Agent Skills 的 AI 编程助手中配置技能目录路径即可。技能会根据对话中的触发词自动激活。

## 技能简介

### component-ai-docs

让 AI 认识业务组件库或项目组件。核心价值：

- **两条路线** -- (A) 为 npm 组件库生成 AI 可消费文档，随版本发布，消费者安装后 AI 自动认识；(B) 盘活历史项目的存量组件，自动提取类型 + 推导使用边界 + 生成文档
- **metadata.json 标准** -- 定义 `useWhen`/`dontUseWhen`/`prefer` 三段式组件使用边界，只有人能写对、AI 最需要的信息
- **JSDoc 写给 AI 看** -- 区分"写给人看的注释"和"写给 AI 看的注释"，给出具体写作规范
- **格式统一** -- 不管来源，最终产出的 `ai/` 目录结构一致，AI 消费方式一样

### editorial-deck-design

面向品牌提案、策略汇报等高感知度视觉场景，强制 AI 以顶尖创意热店的水准输出 PPT 排版指令。涵盖底图处理、氛围层叠加、字体混搭、非对称排版、杂志调色盘等完整视觉语法体系。

### vue-doc-extractor

从 Vue 3 SFC 源码中提取框架无关的产品文档（Markdown），核心用途：
- **跨框架可迁移** -- 提取出的文档可在 React/Vue 等任意框架中还原页面
- **快速理解业务** -- 新成员通过文档即可掌握页面完整逻辑
- 支持 5 种场景类型：`query-list` / `form` / `detail-page` / `approval-flow` / `module`

### red-team-arch-advisor

扮演 Principal Engineer / CTO 级别的架构对抗顾问，通过四阶段对话协议（深度理解 -> 视野拓展 -> 有据挑战 -> 针对性辅导）帮助用户审视技术方案。核心价值：
- 绝不默认同意，用尖锐问题深挖盲区
- 引入外部行业案例与替代方案
- 基于真实故障分析论证风险

### baby-product-advisor

帮助新手父母在混乱的母婴市场中做出理性消费决策。核心价值：

- **反营销洗脑** — 识别"母婴专用"定价陷阱，判断产品是否存在同材质便宜替代品
- **阶段化清单** — 待产包 → 0-1月 → 1-3月 → 3-6月 → 6-12月，按必需品/可选品/不必买分类
- **安全标准速查** — 对照中国 GB 标准、3C 认证、有害成分黑名单进行安全判定
- **智商税避坑** — 经典智商税产品（婴儿水、学步车、定型枕、防辐射服等）完整清单
- **二手安全分级** — 🟢安全二手 / 🟡有条件 / 🔴必须全新，使用周期标注
- **季节适配** — 按出生月份自动适配服装、护肤、防痱、蚊虫策略
- **预算规划** — 三档预算框架（最低/舒适/宽裕），标注可省钱方向

### write-prd

将用户想法转化为结构化 PRD 文档的需求工程技能。核心价值：

- **智能推断优先** — 从上下文探索中自动推断内容，最小化用户交互，只确认 4 个核心问题
- **草稿先行** — 先输出完整草稿到文件，标记 `[推断]` / `[待确认]` / `[用户提供]`，用户可编辑后再确认
- **标准化模板** — 遵循通用需求解析模板（含需求概述、需求解析、需求详情、补充需求四层结构）
- **知识沉淀** — 确认后的领域知识自动回流到知识库，积累业务上下文供后续 PRD 复用
- **配套技能** — 创建后的 PRD 如需迭代调整，使用 `update-prd` 技能进行需求澄清

### update-prd

对已有 PRD 进行变更、补充和澄清的需求迭代技能。与 `write-prd`（从0到1创建）互补。核心价值：

- **变更分类** — 自动识别变更类型：字段补充、流程修正、规则澄清、范围变更、角色调整、入口变更、细节补全
- **影响范围分析** — 标记直接影响的章节 + 一致性传播影响的章节，避免遗漏联动修改
- **一次确认** — 给出完整变更摘要（含 before/after 预览），用户一次性审批后批量执行
- **一致性校验** — 更新后交叉验证：流程图 ↔ 业务规则 ↔ 业务要素 ↔ 原型图，自动标记矛盾
- **变更日志** — 单文件版本链，尾部追加变更日志（含版本号、变更类型、影响章节），保持历史可追溯
