# 行业案例速查弹药库

用于架构挑战的起步弹药。这些是可以快速引用的知名案例。每次具体讨论时，始终用 `WebSearch` 搜索最相关、最新的案例。

## 数据库与存储

| 公司 | 迁移路径 | 年份 | 根因 | 关键指标 |
|------|---------|------|------|---------|
| Amazon | Oracle -> DynamoDB | 2004-2012 | 单写入者关系型数据库在 ~100K TPS 写入时触及物理极限 | SOSP 2007 Dynamo 论文 |
| Uber | Postgres -> Schemaless MySQL | 2016 | 写放大、复制级联延迟 | "Why Uber Switched from Postgres to MySQL" |
| Discord | MongoDB -> Cassandra -> ScyllaDB | 2017-2023 | Cassandra 热分区、JVM GC 停顿 | p99 延迟: 40ms -> 15ms |
| Twitter | MySQL -> Manhattan (自研) | 2014 | MySQL 复制跟不上推文写入量 | "Manhattan, our real-time, multi-tenant distributed database" |
| Figma | Postgres -> Postgres (水平分片) | 2023 | 选择**不迁移**，投资于 Postgres 分片 | "How Figma's Databases Team Lived to Tell the Scale" |

## 微服务与拆分

| 公司 | 模式 | 年份 | 教训 |
|------|------|------|------|
| Netflix | 单体 -> 700+ 微服务 -> 领域分组 | 2008-2020 | 过度拆分制造"死星"依赖地狱 |
| Segment | 120+ 微服务 -> 回归单体 | 2018 | 50 人团队撑不住 120 个服务。合并后部署频率提升 5 倍 |
| Shopify | 单体 -> 模块化单体 | 2019-2023 | 选模块而非微服务。"Deconstructing the Monolith" |
| Amazon | 单体 -> 微服务 -> "回归基础" | 2023 | Prime Video 视频监控从 Serverless 微服务回退到单体；成本降低 90% |

## 事件流与消息

| 公司 | 事件 | 核心洞察 |
|------|------|---------|
| LinkedIn | 构建 Kafka (2011) | Append-only log 作为事实来源。Jay Kreps "The Log" (2013) |
| Uber | Kafka 脑裂 (2019) | 多区域部署必须在消费端做显式幂等。At-least-once 才是现实 |
| Warpstream | 对象存储上的 Kafka 兼容方案 (2023) | 存算分离；消除 Broker 状态管理 |

## 缓存

| 公司 | 事件 | 核心洞察 |
|------|------|---------|
| Facebook | Memcached 惊群效应 (2013) | 部署期间缓存失效 = 10 倍流量放大。NSDI 2013 论文 |
| Cloudflare | CDN 缓存投毒 | Cache Key 设计是架构决策，不是配置项 |
| Instagram | 大规模惊群 | 基于 Lease 的方案 + 请求合并 |

## 一致性与协调

| 公司 | 技术 | 核心洞察 |
|------|------|---------|
| Google | Spanner + TrueTime (2012) | 外部一致性需要硬件时钟。GPS + 原子钟 = ~7ms 不确定性 |
| CockroachDB | 基于 NTP 的 Spanner 替代 | ms 级时钟不确定性 = 更大的 commit-wait = 更高的延迟下限 |
| Stripe | 幂等键 (Idempotency Keys) | 通过应用层幂等实现分布式协调，而非分布式锁 |

## 韧性与流量

| 公司 | 事件 | 核心洞察 |
|------|------|---------|
| GitHub | 1.35 Tbps DDoS (2018) | 限流必须在网络边缘做，不是应用层 |
| Stripe | 重试风暴 (2019) | 部分故障期间客户端重试 = 10 倍负载放大 |
| AWS | S3 宕机 (2017) | 单次人为错误级联扩散至整个 US-EAST-1；爆炸半径是半个互联网 |
| Fastly | 全球 CDN 宕机 (2021) | 一次配置推送在 49 秒内击垮 85% 的网络 |

## 关键指标拷问清单

每次评审架构时，要求用户给出具体数字：

| 指标 | 尖锐问题 |
|------|---------|
| **RTO** | 主库物理损毁无法恢复，多少分钟恢复完整服务？ |
| **RPO** | 你能接受永久丢失多少秒的数据？ |
| **10 倍流量下的 p99** | 明天流量突增 10 倍，你的尾延迟是多少？ |
| **爆炸半径** | 这个服务挂了，多少下游服务跟着挂？ |
| **冷启动** | 新区域、零状态，从部署到能接流量要多久？ |
| **10 倍成本** | 流量涨 10 倍，你的成本涨 10 倍还是 100 倍？ |
| **团队容量** | 新来的工程师第一周能安全发布吗？ |
