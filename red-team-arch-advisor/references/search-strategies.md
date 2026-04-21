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

## 何时检索

- **阶段二（视野拓展）必须检索** — 至少 2 次搜索，找到真正相关的外部视角。
- **阶段三（挑战）验证性检索** — 引用具体事件前先确认真实性。
- **不确定时就搜** — 绝不编造公司名、年份或故障指标。搜不到就说"需要验证具体细节"。
