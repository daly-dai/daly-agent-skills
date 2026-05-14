# 审批流页面 — 提取指南

## 识别阶段（分析 Vue 源码，内部思考）

### 1. 页面入口与数据接收
如何到达此页面、接收哪些参数。

### 2. 审批状态定义（关键）
审批流程有哪些状态、状态的业务含义。

### 3. 状态流转规则（关键）
什么操作触发状态变更、前置条件是什么。

### 4. 审批操作展示
审批操作区显示什么信息（审批意见、附件、时间线等）。

### 5. 审批操作按钮与数据传递（关键）
每个审批按钮的行为、传递什么数据（审批意见、附件等）。

### 6. 审批表单/弹窗
审批时是否需要填写表单、表单字段和校验规则。

### 7. 审批历史
审批历史记录如何展示。

### 8. 业务详情展示
关联的业务数据显示。

### 9. 其他 API 契约
审批提交、审批历史查询等接口。

### 10. 常量与枚举（关键）
扫描所有外部 import 的常量/枚举。

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

@FILL:TABLE status_definition [P0]
提示: 审批状态定义
列: 状态值 | 状态名称 | 说明

@FILL:TABLE status_transitions [P0]
提示: 状态流转规则
列: 当前状态 | 操作 | 目标状态 | 前置条件

@FILL:TABLE approval_actions [P0]
提示: 审批操作按钮
列: 按钮 | 权限 | 可见状态 | 行为 | 携带数据 | 目标

@FILL:BLOCK approval_detail [P0]
提示: 每个审批操作的完整交互流程（含审批表单字段、数据传递）

@FILL:BLOCK api_approval [P0]
提示: 审批相关接口契约（详情查询 + 审批提交 + 历史查询）
```

### P1 标记

```
@FILL:TABLE business_fields [P1]
提示: 关联业务数据展示字段
列: 字段标签 | 数据字段 | 展示格式 | 备注

@FILL:TABLE history_display [P1]
提示: 审批历史展示
列: 展示信息 | 数据来源 | 说明
```

### P2 标记

```
@FILL:TABLE constants [P2]
提示: 所有外部常量的完整定义。能静态确定的 → 内联实际值标注"[常量]"。无法确定的 → 标注"[待补充: 原因]"。参照 patterns-core.md 第 8.4 节提取边界。无则填"无外部常量"
列: 常量名 | 类型 | 提取状态 | 完整定义/待补充说明 | 用途
```markdown
# @FILLED:page_title — 审批流页

```

## 概述
@FILLED:page_overview

## 页面入口
@FILLED:entry_info

## 审批状态定义
@FILLED:status_definition

## 状态流转
@FILLED:status_transitions

## 审批操作
@FILLED:approval_actions

### 操作详细说明
@FILLED:approval_detail

## 业务数据展示
@FILLED:business_fields

## 审批历史
@FILLED:history_display

## 接口契约
@FILLED:api_approval

## 常量定义
@FILLED:constants
```
