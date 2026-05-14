# 表单页 — 提取指南

## 识别阶段（分析 Vue 源码，内部思考）

### 1. 判断表单模式
新增/编辑/新增编辑复用。复用模式需提取差异部分。

### 2. 页面入口与数据接收（关键）
表单如何接收数据：从 URL 路径参数、URL 查询参数、还是从上级页面传入的数据对象。记录参数名和传递方式。

### 3. 表单整体结构
表单布局方式、字段分组。

### 4. 表单字段
对每个字段提取：标签、字段名、控件类型、必填/可选、输入限制（maxLength/min/max）、占位提示。

### 5. 新增/编辑字段差异（复用模式时）
新增和编辑共用一个表单时，哪些字段编辑时不显示/只读。

### 6. 校验规则
required、pattern、自定义 validator 的逻辑。

### 7. 字段联动与条件展示（关键）
字段之间的联动关系（A 选择 X 时 B 显示/隐藏/改变选项/改变校验）、条件展示、动态控件类型。

### 8. 编辑模式 — 数据回显映射（关键）
编辑时如何加载已有数据：接口字段 → 表单字段的映射关系、需要转换的字段（日期格式化、枚举转换等）。

### 9. 提交参数组装（关键）
提交时如何组装数据：直接传递的字段、有转换的字段、被排除的字段。

### 10. 提交后行为
提交成功后做什么：关闭弹窗、跳转页面、刷新列表。

### 11. 其他操作
取消、重置等按钮的行为。

### 12. 其他 API 契约
下拉选项加载 API、数据校验 API 等。

### 13. 常量与枚举（关键）
扫描所有外部 import 的常量/枚举，追踪到源文件读取实际值。

---

## 输出阶段（填 @FILL 标记）

> 🛑 输出前必须执行 Step 5 输出自检。参照 `patterns-core.md` 第 9 节翻译表。

---

## @FILL 输出标记

### P0 标记（必须提取 — 数据流转 + API 契约）

```
@FILL:VALUE page_title [P0]
提示: 页面名称

@FILL:VALUE page_overview [P0]
提示: 一句话概述

@FILL:VALUE form_mode [P0]
提示: 表单模式（新增 / 编辑 / 新增编辑复用）

@FILL:BLOCK entry_info [P0]
提示: 页面入口信息。如何到达此页面、从哪接收数据、接收哪些参数

@FILL:TABLE form_fields [P0]
提示: 表单所有字段
列: 序号 | 字段标签 | 字段名 | 控件类型(通用术语) | 必填 | 输入限制 | 备注

@FILL:TABLE field_diff [P0]
提示: 新增/编辑字段差异（复用模式时）。编辑模式不显示/只读的字段
列: 字段名 | 新增 | 编辑 | 说明

@FILL:BLOCK submit_data_assembly [P0]
提示: 提交参数组装逻辑（直接传递的字段 + 有转换的字段 + 被排除的字段）
格式：分"直接传递"、"有转换"、"排除"三组

@FILL:BLOCK submit_behavior [P0]
提示: 提交成功后行为 + 提交失败行为 + 取消/重置行为

@FILL:BLOCK backfill_map [P0]
提示: 编辑模式数据回显映射（接口字段→表单字段 + 转换逻辑）

@FILL:BLOCK api_form [P0]
提示: 提交接口 + 编辑时加载详情接口 的契约。按 api_list_query 格式
```

### P1 标记

```
@FILL:TABLE validations [P1]
提示: 校验规则
列: 字段名 | 规则类型 | 规则详情

@FILL:TABLE linkage_rules [P1]
提示: 字段联动规则
列: 触发字段 | 触发条件 | 影响字段 | 影响效果
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
4. 无法确定的内容填 `待确认`

---

## 组装模板

```markdown
# @FILLED:page_title — 表单页

## 概述
@FILLED:page_overview
- 表单模式: @FILLED:form_mode

## 数据模型
@FILLED:data_model

## 页面入口
@FILLED:entry_info

## 表单字段
@FILLED:form_fields

## 新增/编辑差异
@FILLED:field_diff

## 校验规则
@FILLED:validations

## 字段联动
@FILLED:linkage_rules

## 数据回显（编辑模式）
@FILLED:backfill_map

## 提交参数组装
@FILLED:submit_data_assembly

## 提交行为
@FILLED:submit_behavior

## 接口契约
@FILLED:api_form

## 常量定义
@FILLED:constants
```
