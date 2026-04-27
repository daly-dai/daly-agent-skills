# Ant Design Vue 差异指南

识别 Ant Design Vue (a-* 前缀) 的特有模式。基础组件映射参见 `patterns-ui-mapping.md`。

## 1. 特有模式

### 1.1 配置式表格

表格通过 `:columns` 配置数组定义列：

```vue
<a-table
  :columns="columns"
  :data-source="dataList"
  :pagination="pagination"
  :row-selection="rowSelection"
>
  <template #bodyCell="{ column, record, text }">
    <span v-if="column.dataIndex === 'status'">
      <a-tag :color="record.status === 1 ? 'green' : 'red'">{{ text }}</a-tag>
    </span>
  </template>
</a-table>
```

**提取要点**：
- `columns` 数组中每个对象的 `title`（表头）、`dataIndex`（字段名）必须记录
- `#bodyCell` 插槽中通过 `column.dataIndex` 判断自定义渲染的列
- `:row-selection` 配置对象中包含 `selectedRowKeys` 和 `onChange`

### 1.2 下拉选项 Prop 式传入

`a-select`、`a-cascader`、`a-tree-select` 均通过 `:options` 直接传入选项数组：

```vue
<a-select :options="statusOptions" mode="multiple" />
<!-- 选项格式：[{ label: '启用', value: 1 }, ...] -->
```

### 1.3 弹窗显隐控制

弹窗和抽屉使用 `v-model:open`（或 `:open` + `@update:open`）控制显隐：

```vue
<a-modal v-model:open="visible" title="标题" :confirm-loading="submitting" @ok="handleOk">
<a-drawer v-model:open="drawerVisible" title="详情" width="600">
```

### 1.4 表单字段绑定

`a-form-item` 使用 `name` 属性绑定字段路径（支持嵌套如 `name="user.age"`）：

```vue
<a-form :model="formData" :rules="rules">
  <a-form-item label="用户名" name="username">
    <a-input v-model:value="formData.username" />
  </a-form-item>
</a-form>
```

### 1.5 消息提示函数调用

```js
import { message, Modal } from 'ant-design-vue'

message.success('操作成功')
message.error('操作失败')
Modal.confirm({ title: '确认删除？', onOk: () => deleteItem() })
```
