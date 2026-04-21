# Agent Skills

个人 AI Agent 技能库，收录用于增强 AI 编程助手能力的自定义技能（Skills）。

每个技能以独立目录组织，包含 `SKILL.md` 主文件及可选的 `references/`、`scripts/` 辅助资源。

## 技能清单

| 技能 | 说明 | 触发词示例 |
|------|------|-----------|
| [editorial-deck-design](editorial-deck-design/) | 顶尖创意热店级 PPT 视觉提案排版，以全球顶尖创意热店的视觉水准生成幻灯片排版指令，消除模板感与 AI 塑料感 | PPT 排版、视觉提案、幻灯片设计 |
| [vue-doc-extractor](vue-doc-extractor/) | 从 Vue 3 页面组件中提取框架无关的产品文档，支持查询列表、表单、详情页、审批流、整模块等场景 | 提取文档、vue文档提取、模块文档提取 |
| [red-team-arch-advisor](red-team-arch-advisor/) | 架构对抗顾问，用真实行业案例挑战设计方案，拓宽架构视野，提供针对性辅导建议 | 架构评审、架构挑战、红队审查、技术方案评审 |

## 目录结构

```
agent-skills/
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
```

## 使用方式

将本仓库克隆到本地后，在 Qoder 等支持 Agent Skills 的 AI 编程助手中配置技能目录路径即可。技能会根据对话中的触发词自动激活。

## 技能简介

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
