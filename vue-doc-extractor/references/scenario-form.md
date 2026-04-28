# 表单页 — 提取指南

统一处理：**纯新增**、**纯编辑**、**新增编辑复用**。输出使用通用 UI 术语。

## 提取清单

### 1. 判断表单类型

- **纯新增** — 无数据加载，无 `isEdit`，只调 create API
- **纯编辑** — 有数据加载回显，只调 update API
- **新增编辑复用** — 通过 `isEdit = computed(() => !!route.params.id)` 或 `props.mode` 区分

### 2. 页面入口与参数接收（关键）

**新增入口**：来源页面/按钮、呈现形式（页面/弹窗/抽屉）、是否接收初始参数

**编辑入口**：来源页面/按钮、传递了什么参数（整条record/仅ID/部分字段）、传递方式（路由params/query/Props）、接收方式

### 3. 表单整体结构

查找 `<a-form>`，提取：呈现形式、布局方式、分栏结构、分区方式

### 4. 表单字段

遍历 `<a-form-item>`，每个提取：字段标签、字段名(`v-model`)、控件类型(**转通用术语**)、必填、业务含义、选项来源、显著约束、新增/编辑差异

### 5. 新增/编辑字段差异（仅复用模式）

查找 `:disabled="isEdit"`(禁用)、`v-if="!isEdit"`/`v-if="isEdit"`(显隐)、computed rules 中的模式判断(校验差异)。记录：字段名→新增时→编辑时→原因

### 6. 校验规则

必填/长度/格式/自定义校验。自定义校验需追踪函数体描述逻辑。新增/编辑不同则分别说明。

### 7. 字段联动与条件展示（关键）

逐一识别以下 5 类联动，代码模式参考 patterns-core.md 第5节（数据流转模式）：

**7.1 条件显隐** — `<a-form-item v-if="condition">` 或整个区域(Card/div)的 `v-if`/`v-show`
- 记录：触发字段+条件 → 受影响字段或字段组 → 显示后是否必填 → 多级链(A→B→C)

**7.2 级联选择** — `watch(parent)` → 清空子级 + 重新加载选项
- 记录：父→子字段 → 子级加载API → 是否清空 → 多级级联

**7.3 值联动** — `watch(trigger)` → 自动填充/计算其他字段
- 记录：触发字段 → 被填充字段 → 来源(API/计算/选项属性) → 可否修改

**7.4 动态校验** — `computed rules` 中根据条件改变校验
- 记录：控制字段+条件 → 受影响字段 → 校验变化

**7.5 动态控件** — 根据条件用 `v-if` 切换控件类型或动态绑定属性
- 记录：控制字段+条件 → 控件变化

### 8. 编辑模式 — 数据回显处理（关键）

**加载流程**：调哪个API、何时调(onMounted/watch props)、传什么参数

**回显映射**（参考 patterns-core.md 5.4节）：逐字段追踪 接口字段→表单字段 映射，标注直接赋值/需转换/嵌套拍平/不回显

### 9. 提交参数组装（关键）

追踪提交函数内部参数组装（参考 patterns-core.md 5.3节）：
- **新增提交**：字段映射 + 转换 + 排除项
- **编辑提交**（若不同）：id传递方式、与新增差异、是否差异提交
- **复用模式**：追踪 `if(isEdit)` 分支逻辑

### 10. 提交后行为

成功（提示+跳转/关闭刷新）、失败（错误展示）、Loading状态

### 11. 其他交互

取消/返回、表单重置、草稿保存

### 12. 所有 API 契约

逐个记录完整请求参数和响应结构：新增API、编辑加载API、编辑提交API、选项加载API、校验API

### 13. 常量与枚举（关键）

扫描所有从外部文件 import 的常量/枚举（参考 patterns-core.md 第8节），追踪到源文件读取实际值。重点关注：
- 选项列表常量（用于下拉选择、单选/多选等控件）
- 校验相关常量（正则表达式、长度限制等）
- 表单初始值常量
- 状态/类型映射常量（用于条件判断、联动逻辑等）

---

## 输出标记

### P0 标记（必须提取 — 数据流转 + API 契约）

```
@FILL:VALUE page_title [P0]
提示: 页面名称，从文件名和业务内容推断

@FILL:VALUE page_overview [P0]
提示: 一句话概述，含业务功能、面向角色

@FILL:VALUE form_type [P0]
提示: 表单类型，填 纯新增 / 纯编辑 / 新增编辑复用

@FILL:VALUE form_type_check [P0]
提示: 模式判断逻辑。纯新增/纯编辑填"不适用"，复用模式填判断代码(如 !!route.params.id)

@FILL:BLOCK entry_info [P0]
提示: 页面入口与参数。分"新增入口"和"编辑入口"两段（纯模式只写适用的一段）。每段含：来源页面/按钮、呈现形式(独立页面/弹窗/抽屉)、传递参数名和值、传递方式(路由params/query/Props)

@FILL:TABLE form_fields [P0]
提示: 所有表单字段，从 <a-form-item> 或等价结构中提取
列: 序号 | 字段标签 | 字段名 | 控件类型 | 必填 | 选项来源 | 所在分区 | 新增/编辑差异

@FILL:TABLE field_diff [P0]
提示: 新增/编辑差异汇总。纯新增/纯编辑填"不适用"
列: 字段名 | 新增时 | 编辑时 | 原因

@FILL:BLOCK submit_new [P0]
提示: 新增提交参数组装。追踪提交函数，列出前端字段到接口参数的映射和转换逻辑。直接传递的字段合并为一行"以下字段直接传递: xxx"

@FILL:BLOCK submit_edit [P0]
提示: 编辑提交参数组装。与新增差异部分重点说明。纯新增填"不适用"

@FILL:BLOCK submit_behavior [P0]
提示: 提交后行为。成功(提示文案+跳转目标/关闭刷新)、失败(错误展示方式)、Loading状态

@FILL:BLOCK data_load [P0]
提示: 编辑模式数据加载。API名、触发时机(onMounted/watch)、参数来源。纯新增填"不适用"

@FILL:TABLE backfill_map [P0]
提示: 编辑回显映射，接口字段→表单字段+转换逻辑。直接赋值的字段可合并。纯新增填"不适用"
列: 接口字段 | 表单字段 | 转换逻辑

@FILL:BLOCK api_all [P0]
提示: 所有 API 契约，逐个记录。每个API包含：函数名、来源文件、请求方式、请求路径、请求参数表(参数名|类型|必传|说明)、响应数据结构(前端实际使用的字段)
```

### P1 标记（建议提取 — 联动 + 校验）

```
@FILL:VALUE form_layout [P1]
提示: 表单布局描述，如 水平/垂直, 单列/双列, 分区方式

@FILL:TABLE validations [P1]
提示: 校验规则汇总，自定义校验需追踪函数体描述逻辑
列: 字段名 | 规则 | 提示信息 | 适用模式(新增/编辑/通用)

@FILL:TABLE linkage_visibility [P1]
提示: 条件显隐联动，无则填"无条件显隐"
列: 序号 | 触发字段 | 触发条件 | 受影响字段/区域 | 显隐效果 | 显示后必填 | 业务原因

@FILL:TABLE linkage_cascade [P1]
提示: 级联选择，无则填"无级联选择"
列: 序号 | 父级字段 | 子级字段 | 子级选项加载 | 清空子级 | 备注

@FILL:TABLE linkage_value [P1]
提示: 值联动，无则填"无值联动"
列: 序号 | 触发字段 | 被填充字段 | 填充来源 | 可修改 | 业务原因

@FILL:TABLE linkage_validation [P1]
提示: 动态校验，无则填"无动态校验"
列: 序号 | 控制字段 | 条件 | 受影响字段 | 校验变化

@FILL:TABLE linkage_control [P1]
提示: 动态控件，无则填"无动态控件"
列: 序号 | 控制字段 | 条件 | 受影响字段 | 控件变化
```

### P2 标记（空间充足时提取 — 权限 + 引用 + 杂项）

```
@FILL:TABLE constants [P2]
提示: 所有外部常量的完整定义，必须追踪源文件内联实际值。无则填"无外部常量"
列: 常量名 | 来源文件 | 类型 | 完整定义 | 用途

@FILL:TABLE references [P2]
提示: 引用的子组件、composable、工具模块
列: 类型 | 名称 | 来源路径 | 用途

@FILL:VALUE other_interactions [P2]
提示: 其他交互描述，如取消/返回行为、草稿保存等。无则填"无"

@FILL:VALUE notes [P2]
提示: 提取说明，含分析文件列表和待确认项。无待确认项则填"无"
```

---

## 填充规范

1. **每个标记独立填充**，格式为：
   ```
   @FILLED:<id>
   <内容>
   @END
   ```
2. TABLE 类型：输出 markdown 表格体（不含表头），空单元格填 `-`
3. BLOCK 类型：自由文本，可用 markdown 列表、代码块、嵌套表格
4. VALUE 类型：单行字符串
5. **禁止出现框架特定组件名**（a-form、el-input、van-field 等），统一用通用术语
6. 无法确定的内容填 `待确认`，不要猜测
7. 字段名、API 函数名等业务标识保留原文

## 组装模板

```markdown
# @FILLED:page_title — 表单页

## 概述
@FILLED:page_overview

## 表单类型
- 类型: @FILLED:form_type
- 模式判断: @FILLED:form_type_check

## 页面入口与参数
@FILLED:entry_info

## 表单结构
- 布局: @FILLED:form_layout

## 表单字段
@FILLED:form_fields

## 新增/编辑差异汇总
@FILLED:field_diff

## 校验规则
@FILLED:validations

## 字段联动与条件展示

### 条件显隐
@FILLED:linkage_visibility

### 级联选择
@FILLED:linkage_cascade

### 值联动
@FILLED:linkage_value

### 动态校验
@FILLED:linkage_validation

### 动态控件
@FILLED:linkage_control

## 数据回显（编辑模式）

### 加载流程
@FILLED:data_load

### 接口响应 → 表单字段映射
@FILLED:backfill_map

## 提交参数组装

### 新增提交
@FILLED:submit_new

### 编辑提交
@FILLED:submit_edit

### 提交行为
@FILLED:submit_behavior

## 其他交互
@FILLED:other_interactions

## 接口契约
@FILLED:api_all

## 常量定义
@FILLED:constants

## 引用的组件与模块
@FILLED:references

## 提取说明
@FILLED:notes
```
