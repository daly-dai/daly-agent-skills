# 活水检索策略手册

使用 `WebSearch` 最大化外部知识注入效果的具体检索模式。

## 策略一：同问题-跨领域检索

当用户描述架构问题时，搜索**不同领域**的公司如何解决**相同的根本问题**。

搜索模式：
- `"[核心问题关键词] architecture" site:engineering.fb.com OR site:netflixtechblog.com OR site:eng.uber.com`
- `"[核心问题]" "at scale" engineering blog [当前年份]`
- `"[技术X] vs [技术Y]" production experience`

示例：用户问订单管理的 Event Sourcing →
- 搜索：`"event sourcing" "at scale" lessons learned production`
- 搜索：`"order management" architecture engineering blog`
- 搜索：`"CQRS" production pitfalls postmortem`

## 策略二：故障与事后分析检索

寻找与用户技术选型相关的真实故障案例。

搜索模式：
- `"[技术名称]" outage postmortem [年份范围]`
- `"[技术名称]" "lessons learned" "the hard way" engineering`
- `"[技术名称]" migration "moved away from" OR "switched from"`

示例：用户提议用 MongoDB 存储金融数据 →
- 搜索：`MongoDB "data loss" OR "consistency issue" postmortem`
- 搜索：`"moved away from MongoDB" engineering blog`
- 搜索：`"MongoDB" "at scale" limitations production`

## 策略三：替代方案发现检索

主动寻找用户没有提到的解决方案。

搜索模式：
- `"[问题领域]" architecture "we chose" OR "we built" engineering blog [近两年]`
- `"alternative to [当前技术]" production scale`
- `"[问题领域]" "open source" OR "managed service" comparison [当前年份]`

示例：用户所有场景都用 Redis →
- 搜索：`"alternative to Redis" "at scale" distributed cache 2025`
- 搜索：`"Redis replacement" OR "beyond Redis" engineering`
- 搜索：`"distributed cache" architecture comparison production`

## 策略四：规模匹配参考检索

寻找与用户**相似规模**的公司（不只是 FAANG）。

搜索模式：
- `"[N] requests per second" OR "[N] QPS" architecture`
- `"[团队人数] engineers" architecture decisions`
- `"startup" OR "mid-stage" OR "series [A/B/C]" architecture lessons`

## 策略五：技术最新演进检索

检查用户选择的技术是否已经演进或被取代。

搜索模式：
- `"[技术名称]" roadmap OR "what's new" [当前年份]`
- `"[技术名称] 2.0" OR "next generation" OR "v2"`
- `"[技术名称]" deprecation OR "end of life" OR sunset`

## 策略六：学术与理论检索

当讨论需要超越工程实践、触及基本原理时使用。工程博客讲"怎么做"，学术论文讲"为什么"。

搜索模式：
- `"[技术问题]" survey OR "state of the art" site:arxiv.org`
- `"[架构模式]" formal verification OR "formal methods" site:arxiv.org`
- `"[设计原则]" "cognitive load" OR "human factors" HCI`
- `"[领域]" "fundamental limits" OR "impossibility" theory`
- `"[架构决策]" "design rationale" OR "architectural trade-off" research`

示例：

用户讨论 AI Agent 的 context window 分配 →
- 搜索：`"context window" allocation LLM agent survey 2025 site:arxiv.org`
- 搜索：`"lost in the middle" attention mechanism long context`
- 搜索：`"tool-augmented LLM" architecture cognitive science`

用户讨论组件库的 API 设计 →
- 搜索：`"API design" usability "developer experience" empirical study`
- 搜索：`"design system" governance evolution research`

用户讨论 Skill 编排的容错 →
- 搜索：`"multi-agent" coordination fault tolerance survey site:arxiv.org`
- 搜索：`"error recovery" pipeline orchestration patterns`

**触发时机：**
- 用户的问题涉及"为什么这样设计"而非"怎么做"
- 工程博客找不到满意的解释
- 阶段二需要从基本原理推导方案

## 何时检索

- **阶段二（视野拓展）必须检索** — 至少 2 次搜索，找到真正相关的外部视角。先做第一性原理推导（不输出），再带着判断力去搜。
- **阶段三（挑战）验证性检索** — 引用具体事件前先确认真实性。
- **阶段二/三 涉及理论问题** — 工程博客说不清时，切到策略六搜学术来源。
- **不确定时就搜** — 绝不编造公司名、年份或故障指标。搜不到就说"需要验证具体细节"。
