# 查询列表页 — 提取指南

## 提取清单

输出使用通用 UI 术语。

### 1. 搜索/筛选区域

查找 `<a-form>` 包裹的搜索区域，对每个 `<a-form-item>` 提取：字段标签、字段名、控件类型(**转通用术语**)、选项来源(参考对应组件库的 patterns 文件中的下拉选项来源章节)、业务含义

同时提取：搜索按钮触发函数、重置按钮行为、展开/收起功能

### 2. 查询参数组装（关键）

追踪搜索触发函数内部(参考 patterns-core.md 5.5节)：
- 字段如何映射为 API 请求参数(直接传/转换/排除)
- 日期范围如何拆分
- 分页参数名和来源

### 3. 列表查询 API 契约（关键）

追踪主查询 API：函数名/路径/方式 → 入参结构(逐字段) → 响应结构(列表路径+分页+单条记录字段)

### 4. 数据列表/表格

查找 `<a-table>` + `columns`，每列提取：列标题、dataIndex、展示格式(纯文本/日期/状态标签/链接等)、特殊逻辑(排序/固定)

### 5. 操作列与页面交互（关键）

每个按钮追踪：文本、权限、行为类型、**传递参数**(传了record哪些字段)、参数传递方式、目标页面/组件

删除操作额外记录：确认文案、API入参、成功行为

### 6. 工具栏/批量操作

表格上方按钮(新增/批量删除/导出)，同样追踪参数传递

### 7. 分页配置

分页参数名称(pageNo/pageSize)

### 8. 其他 API 契约

逐个记录：删除/状态变更/导出/选项加载 API，含完整入参和响应

### 9. 常量与枚举（关键）

扫描所有从外部文件 import 的常量/枚举（参考 patterns-core.md 第8节），追踪到源文件读取实际值。重点关注：
- 状态/类型映射常量（用于列渲染、标签颜色等）
- 选项列表常量（用于搜索区下拉选项）
- 列定义常量（如果 columns 从外部导入）
- 配置常量（分页大小等）

---

## 输出标记

> 模型按优先级分轮次填充标记，调用方组装为最终 Markdown。
> 每个标记是独立的小任务，填充失败不影响其他标记。

### P0 标记（必须提取 — 数据流转 + API 契约）

```
@FILL:VALUE page_title [P0]
提示: 页面名称，从文件名和业务内容推断

@FILL:VALUE page_overview [P0]
提示: 一句话概述，含业务功能、管理什么数据、面向什么角色

@FILL:TABLE search_fields [P0]
提示: 搜索筛选区所有字段，无则填"无搜索筛选区"
列: 序号 | 字段标签 | 字段名 | 控件类型 | 选项来源 | 业务含义

@FILL:TABLE query_param_mapping [P0]
提示: 搜索字段到接口参数的映射关系。直接传递的字段可合并为一行"以下字段直接传递: xxx, xxx"
列: 前端字段 | 接口参数 | 转换逻辑

@FILL:TABLE list_columns [P0]
提示: 数据列表所有列定义
列: 序号 | 列标题 | 数据字段 | 展示格式 | 备注

@FILL:TABLE operations [P0]
提示: 操作列所有按钮，逐行记录
列: 序号 | 按钮 | 权限 | 可见条件 | 行为 | 传递参数 | 目标

@FILL:BLOCK operations_detail [P0]
提示: 逐个说明每个操作按钮的完整交互流程（触发→确认→API→成功后行为）。每个操作一段。

@FILL:BLOCK api_list_query [P0]
提示: 主列表查询 API 契约。记录：函数名、来源文件、请求方式(GET/POST)、请求路径、请求参数表(参数名|类型|必传|说明)、响应数据结构(前端实际使用的字段及路径)
```

### P1 标记（建议提取 — 字段 + 联动 + 工具栏）

```
@FILL:TABLE toolbar [P1]
提示: 表格上方工具栏按钮（新增/批量删除/导出等），无则填"无工具栏"
列: 按钮 | 权限 | 行为 | 传递参数

@FILL:TABLE pagination [P1]
提示: 分页配置
列: 属性 | 值

@FILL:VALUE row_key [P1]
提示: 行标识字段名，如 id、recordNum

@FILL:VALUE row_selection [P1]
提示: 行选择模式，填 无 / 多选 / 单选
```

### P2 标记（空间充足时提取 — 校验 + 权限 + 引用）

```
@FILL:BLOCK api_other [P2]
提示: 除主查询外的其他 API 契约（删除/状态变更/导出/选项加载等），每个按 api_list_query 格式记录

@FILL:TABLE constants [P2]
提示: 所有外部常量的完整定义，必须追踪源文件内联实际值，标注[常量]。无则填"无外部常量"
列: 常量名 | 来源文件 | 类型 | 完整定义 | 用途

@FILL:TABLE references [P2]
提示: 引用的子组件、composable、工具模块等
列: 类型 | 名称 | 来源路径 | 用途

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
3. BLOCK 类型：自由文本，可用 markdown 列表、代码块
4. VALUE 类型：单行字符串
5. **禁止出现框架特定组件名**（a-table、el-input 等），统一用通用术语
6. 无法确定的内容填 `待确认`，不要猜测

## 组装模板

> 调用方按以下结构将 @FILLED 内容拼装为最终文档。

```markdown
# @FILLED:page_title — 查询列表页

## 概述
@FILLED:page_overview

## 搜索筛选区
@FILLED:search_fields
- 搜索触发: [从源码提取]
- 重置: [从源码提取]

## 查询参数组装
@FILLED:query_param_mapping

## 数据列表
@FILLED:list_columns
- 行标识: @FILLED:row_key | 行选择: @FILLED:row_selection

## 操作列
@FILLED:operations
### 操作详细说明
@FILLED:operations_detail

## 工具栏
@FILLED:toolbar

## 分页
@FILLED:pagination

## 接口契约
### 1. 查询列表
@FILLED:api_list_query
@FILLED:api_other

## 常量定义
@FILLED:constants

## 引用的组件与模块
@FILLED:references

## 提取说明
@FILLED:notes
```
