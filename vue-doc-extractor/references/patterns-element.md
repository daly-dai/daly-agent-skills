# Element Plus 差异指南

识别 Element Plus (el-* 前缀) 的特有模式。基础组件映射参见 `patterns-ui-mapping.md`。

## 1. 特有模式

### 1.1 模板式表格列

表格通过 `<el-table-column>` 模板嵌套定义列，插槽用 `#default="scope"`：

```vue
<el-table :data="tableData" @selection-change="handleSelectionChange">
  <el-table-column type="selection" width="55" />
  <el-table-column prop="name" label="姓名" width="180" sortable />
  <el-table-column prop="status" label="状态">
    <template #default="scope">
      <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
        {{ scope.row.statusLabel }}
      </el-tag>
    </template>
  </el-table-column>
</el-table>
```

**提取要点**：
- `el-table-column` 的 `prop` 对应字段名，`label` 对应表头，必须记录
- 自定义渲染通过 `#default="scope"` 插槽实现，`scope.row` 获取行数据
- 多选通过 `type="selection"` 列 + `@selection-change` 事件实现

### 1.2 嵌套式下拉选项

`el-select` 使用 `<el-option>` 嵌套循环：

```vue
<el-select v-model="form.status" multiple clearable>
  <el-option
    v-for="item in statusList"
    :key="item.value"
    :label="item.label"
    :value="item.value"
  />
</el-select>
```

### 1.3 弹窗显隐控制

弹窗和抽屉统一使用 `v-model` 控制显隐：

```vue
<el-dialog v-model="dialogVisible" title="标题" width="500px">
<el-drawer v-model="drawerVisible" title="详情" direction="rtl" size="600px">
```

### 1.4 表单字段绑定

`el-form-item` 使用 `prop` 属性绑定字段路径（支持嵌套如 `prop="user.age"`）：

```vue
<el-form :model="formData" :rules="rules">
  <el-form-item label="用户名" prop="username">
    <el-input v-model="formData.username" clearable />
  </el-form-item>
</el-form>
```

### 1.5 消息提示函数调用

```js
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

ElMessage.success('操作成功')
ElMessageBox.confirm('确认删除？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消' })
ElNotification.info({ title: '通知', message: '有新的消息' })
```

### 1.6 自动补全回调

`el-autocomplete` 使用 `:fetch-suggestions` 回调获取建议列表：

```vue
<el-autocomplete
  v-model="keyword"
  :fetch-suggestions="querySearch"
  placeholder="请输入关键词"
/>
<!-- querySearch 签名为 (queryString, callback) => void -->
```
