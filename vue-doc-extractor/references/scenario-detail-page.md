# 详情页 — 提取指南

## 识别阶段（分析 Vue 源码，内部思考）

### 1. 页面入口与数据接收（关键）
如何到达此页面、从 URL 参数或上级页面接收哪些参数。

### 2. 数据加载与响应结构（关键）
加载哪些接口、接口返回什么数据、数据如何分发到各个区域。

### 3. 页面头部/摘要区
页面顶部的标题区、摘要信息区。

### 4. Tab 结构
有几个 Tab、每个 Tab 的标题和内容。

### 5. 各 Tab 内容提取
对每个 Tab：展示字段列表、展示方式（描述列表/内嵌列表/图表/自定义）、嵌套弹窗/子组件。

### 6. 操作按钮与交互（关键）
页面级别的操作按钮（编辑、返回、审批通过/驳回等），追踪每个操作的行为和携带数据。

### 7. 其他 API 契约
除主查询外的其他 API（操作类接口）。

### 8. 嵌套弹窗/组件定义
详情页内打开的弹窗、引用的子组件，提取组件功能和 Props。

### 9. Tab 间数据关系
不同 Tab 是否共享同一份数据、是否独立加载。

### 10. 常量与枚举（关键）
扫描所有外部 import 的常量/枚举，追踪到源文件。

---

## 输出阶段（填 @FILL 标记）

> 🛑 输出前必须执行 Step 5 输出自检。参照 `patterns-core.md` 第 9 节翻译表。

---

## @FILL 输出标记

### P0 标记

```
@FILL:VALUE page_title [P0]
提示: 页面名称

@FILL:VALUE page_overview [P0]
提示: 一句话概述

@FILL:BLOCK entry_info [P0]
提示: 如何到达此页面、接收哪些参数

@FILL:BLOCK api_detail [P0]
提示: 详情主查询接口 + 各 Tab 辅助接口 的契约。按 api_list_query 格式

@FILL:TABLE tab_list [P0]
提示: Tab 清单
列: Tab名 | 数据来源 | 说明

@FILL:TABLE fields_basic_info [P0]
提示: 基础信息 Tab 的展示字段
列: 序号 | 字段标签 | 数据字段 | 展示格式 | 备注

@FILL:TABLE operations [P0]
提示: 页面操作按钮
列: 按钮 | 权限 | 行为 | 携带数据 | 目标

@FILL:BLOCK operations_detail [P0]
提示: 每个操作的完整交互流程
```

### P1 标记

```
@FILL:TABLE tab_{name}_fields [P1]
提示: {Tab名}的展示字段。每个 Tab 一个独立的 TABLE
列: 序号 | 字段标签 | 数据字段 | 展示格式 | 备注
```

### P2 标记

```
@FILL:TABLE constants [P2]
提示: 所有外部常量的完整定义。能静态确定的 → 内联实际值标注"[常量]"。无法确定的 → 标注"[待补充: 原因]"。参照 patterns-core.md 第 8.4 节提取边界。无则填"无外部常量"
列: 常量名 | 类型 | 提取状态 | 完整定义/待补充说明 | 用途
```

---

## 填充规范

1. 每个标记独立填充
2. **🛑 禁止出现任何框架痕迹**（参照 `patterns-core.md` 第 9.7 节）
3. 所有枚举/常量值必须内联实际值

---

## 组装模板

```markdown
# @FILLED:page_title — 详情页

## 概述
@FILLED:page_overview

## 数据模型
@FILLED:data_model

## 页面入口
@FILLED:entry_info

## Tab 结构
@FILLED:tab_list

## 基础信息
@FILLED:fields_basic_info

## {Tab2名称}
@FILLED:tab_{name2}_fields

## 操作
@FILLED:operations

### 操作详细说明
@FILLED:operations_detail

## 接口契约
@FILLED:api_detail

## 常量定义
@FILLED:constants
```
