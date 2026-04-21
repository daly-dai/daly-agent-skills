# Ant Design Vue 组件识别指南

识别 Ant Design Vue (a-* 前缀) 组件的使用方式。配合 patterns-core.md 使用。

## 1. Ant Design Vue 组件识别

### 表单组件

| 组件 | 通用术语 | 关键属性 |
|-----|---------|---------|
| `a-form` / `a-form-item` | 表单容器/表单项 | `:model` `:rules` `label` `name` |
| `a-input` | 文本输入框 | `v-model:value` `:maxlength` |
| `a-input-number` | 数字输入框 | `:min` `:max` `:precision` |
| `a-textarea` | 多行文本框 | `:rows` `:maxlength` |
| `a-input-password` | 密码输入框 | |
| `a-select` | 下拉选择 | `:options` `mode="multiple"` `@search` |
| `a-tree-select` | 树形选择 | `:tree-data` `:field-names` |
| `a-cascader` | 级联选择 | `:options` `:field-names` |
| `a-date-picker` | 日期选择 | `format` `picker` |
| `a-range-picker` | 日期范围选择 | `format` |
| `a-radio-group` | 单选组 | `:options` |
| `a-checkbox-group` | 多选组 | `:options` |
| `a-switch` | 开关 | `v-model:checked` |
| `a-upload` | 文件上传 | `v-model:file-list` `:action` |

### 表格组件

| 组件/配置 | 关键属性 |
|----------|---------|
| `a-table` | `:columns` `:data-source` `:pagination` `:loading` `:row-selection` |
| columns 项 | `title` `dataIndex` `width` `fixed` `sorter` `customRender` |
| `#bodyCell` 插槽 | `{ column, record, text }` — 单元格自定义渲染 |

### 布局与展示

| 组件 | 用途 |
|-----|------|
| `a-tabs`/`a-tab-pane` | 标签页，`v-model:activeKey` |
| `a-card` | 卡片容器 |
| `a-descriptions`/`-item` | 描述列表(详情展示) |
| `a-steps`/`a-step` | 步骤条 |
| `a-timeline`/`-item` | 时间线 |
| `a-collapse`/`-panel` | 折叠面板 |

### 交互组件

| 组件 | 用途 |
|-----|------|
| `a-modal` | 弹窗，`v-model:open` `:confirm-loading` |
| `a-drawer` | 抽屉，`v-model:open` `width` |
| `a-popconfirm` | 气泡确认，`@confirm` |
| `a-button` | 按钮，`type` `@click` `:loading` `danger` |
| `a-tag` / `a-badge` | 标签/徽标 |
| `message.success/error` | 全局消息(函数调用) |
| `Modal.confirm` | 确认对话框(函数调用) |

## 2. 下拉选项来源

| 来源类型 | 代码模式 | 记录方式 |
|---------|---------|---------|
| 静态定义 | `[{label:'启用',value:1}]` | 列出所有选项 |
| API 加载 | `onMounted→fetchOptions()` | API函数名 |
| 字典服务 | `useDictStore().getDict('code')` | 字典编码 |
| Store | `useXxxStore().xxxList` | Store名+属性 |
