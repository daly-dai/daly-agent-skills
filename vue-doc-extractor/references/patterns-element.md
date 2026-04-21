# Element Plus 组件识别指南

识别 Element Plus (el-* 前缀) 组件的使用方式。配合 patterns-core.md 使用。

## 1. Element Plus 组件识别

### 表单组件

| 组件 | 通用术语 | 关键属性 |
|-----|---------|---------|
| `el-form` / `el-form-item` | 表单容器/表单项 | `:model` `:rules` `label` `prop` |
| `el-input` | 文本输入框 | `v-model` `:maxlength` `clearable` |
| `el-input-number` | 数字输入框 | `:min` `:max` `:precision` `:step` |
| `el-input type="textarea"` | 多行文本框 | `:rows` `:maxlength` `show-word-limit` |
| `el-select` | 下拉选择 | `v-model` `multiple` `clearable` |
| `el-option` | 下拉选项 | `label` `value` `disabled` |
| `el-cascader` | 级联选择 | `:options` `:props` `clearable` |
| `el-date-picker` | 日期选择 | `v-model` `type` `format` `value-format` |
| `el-time-picker` | 时间选择 | `v-model` `format` `value-format` |
| `el-radio-group` | 单选组 | `v-model` |
| `el-radio` | 单选项 | `label` `disabled` |
| `el-checkbox-group` | 多选组 | `v-model` |
| `el-checkbox` | 多选项 | `label` `disabled` |
| `el-switch` | 开关 | `v-model` `active-text` `inactive-text` |
| `el-upload` | 文件上传 | `v-model:file-list` `:action` `:headers` `accept` |
| `el-color-picker` | 颜色选择器 | `v-model` `show-alpha` |
| `el-slider` | 滑块 | `v-model` `:min` `:max` `:step` `range` |
| `el-transfer` | 穿梭框 | `v-model` `:data` `:titles` |
| `el-autocomplete` | 自动补全 | `v-model` `:fetch-suggestions` `trigger-on-focus` |

### 表格组件

| 组件/配置 | 关键属性 |
|----------|---------|
| `el-table` | `:data` `stripe` `border` `highlight-current-row` `@selection-change` |
| `el-table-column` | `prop` `label` `width` `fixed` `sortable` `type` |
| `#default="scope"` 插槽 | `scope.row` / `scope.$index` — 单元格自定义渲染 |

### 布局与展示

| 组件 | 用途 |
|-----|------|
| `el-tabs`/`el-tab-pane` | 标签页，`v-model` 绑定当前标签名 |
| `el-card` | 卡片容器，`header` 插槽定义标题 |
| `el-descriptions`/`-item` | 描述列表，`title` 属性定义标题 |
| `el-steps`/`el-step` | 步骤条，`active` 属性控制当前步骤 |
| `el-timeline`/`-item` | 时间线，`timestamp` 属性定义时间 |
| `el-collapse`/`-item` | 折叠面板，`v-model` 绑定展开项 |

### 交互组件

| 组件 | 用途 |
|-----|------|
| `el-dialog` | 弹窗，`v-model` 控制显隐，`title` 定义标题 |
| `el-drawer` | 抽屉，`v-model` 控制显隐，`direction` 控制方向 |
| `el-popconfirm` | 气泡确认，`title` `@confirm` `@cancel` |
| `el-button` | 按钮，`type` `@click` `:loading` `plain` `round` |
| `el-tag` | 标签，`type` `closable` `@close` |
| `el-badge` | 徽标，`:value` `:max` `is-dot` |
| `ElMessage` | 全局消息提示，`ElMessage.success/error/warning/info()` 函数调用 |
| `ElMessageBox` | 消息弹框，`ElMessageBox.confirm/alert/prompt()` 函数调用 |
| `ElNotification` | 通知提醒，`ElNotification.success/error/warning/info()` 函数调用 |

## 2. Element Plus 与 Ant Design Vue 关键差异

识别 Element Plus 代码时，注意以下与 Ant Design Vue 的差异：

| 差异点 | Element Plus | Ant Design Vue |
|-------|-------------|---------------|
| 表格列定义 | `<el-table-column>` 模板式，插槽用 `#default="scope"` | `:columns` 配置式，插槽用 `#bodyCell` |
| 下拉选项 | `<el-option>` 嵌套写法 | `:options` prop 直接传入 |
| 表单校验 | `el-form-item` 用 `prop` 绑定字段 | `a-form-item` 用 `name` 绑定字段 |
| 表格多选 | `@selection-change` + `type="selection"` 列 | `:row-selection` prop |
| 弹框显隐 | `v-model` 控制 | `:open` / `v-model:open` 控制 |
| 消息提示 | `ElMessage.success()` / `ElMessageBox.confirm()` | `message.success()` / `Modal.confirm()` |

## 3. Element Plus 下拉选项写法

- `el-select`：使用 `<el-option v-for>` 嵌套循环（与 Ant Design 的 `:options` prop 不同）
- `el-cascader`：使用 `:options` prop + `:props` 配置字段映射
- `el-autocomplete`：使用 `:fetch-suggestions` 回调，签名为 `(query, callback) => void`

## 4. 下拉选项来源

| 来源类型 | 代码模式 | 记录方式 |
|---------|---------|---------|
| 静态定义 | `[{label:'启用',value:1}]` | 列出所有选项 |
| API 加载 | `onMounted→fetchOptions()` | API函数名 |
| 字典服务 | `useDictStore().getDict('code')` | 字典编码 |
| Store | `useXxxStore().xxxList` | Store名+属性 |
