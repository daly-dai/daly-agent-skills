# Vant 差异指南

识别 Vant (van-* 前缀) 的特有模式。基础组件映射参见 `patterns-ui-mapping.md`。

## 1. 特有模式

### 1.1 一体化表单字段（van-field）

`van-field` 集 **label + input + 校验错误提示** 于一体：

```vue
<van-form @submit="onSubmit" @failed="onFailed">
  <van-field
    v-model="form.phone"
    name="phone"
    label="手机号"
    type="tel"
    placeholder="请输入手机号"
    :rules="[{ pattern: /^1\d{10}$/, message: '手机号格式错误' }]"
  />
  <van-button block type="primary" native-type="submit">提交</van-button>
</van-form>
```

**提取要点**：
- `name` 对应表单字段名，`label` 是展示标签，`type` 决定输入类型
- `rules` 是数组格式校验规则，常含 `required`、`pattern`、`validator`
- `readonly` / `disabled` / `placeholder` 等属性直接体现业务约束
- `is-link` + `readonly` + `@click` 的组合通常表示"点击唤起底部选择器"

### 1.2 弹出层体系（van-popup）

`van-popup` 是所有弹出层的底层组件，`position` 决定方向：

| position | 对应通用术语 | 典型使用场景 |
|---------|-----------|-----------|
| `center` | 对话框 | `van-dialog`、居中弹窗 |
| `bottom` | 底部弹出/选择器 | `van-picker`、`van-action-sheet`、`van-datetime-picker` |
| `left` / `right` | 抽屉 | 侧滑筛选、侧滑详情 |
| `top` | 顶部弹出 | 较少使用 |

```vue
<van-popup v-model:show="showPicker" position="bottom" round>
  <van-picker :columns="columns" @confirm="onConfirm" />
</van-popup>
```

**提取要点**：
- 提取弹窗内容时，先看 `position` 判断弹出方向，再看内部嵌套组件判断具体用途
- `round` 属性表示底部弹出时顶部圆角，常见于选择器场景

### 1.3 无限滚动列表（van-list）

移动端列表页不使用传统表格，而是由 `van-pull-refresh` + `van-list` + `van-cell` 三层组成：

```vue
<van-pull-refresh v-model="refreshing" @refresh="onRefresh">
  <van-list
    v-model:loading="loading"
    v-model:error="error"
    :finished="finished"
    finished-text="没有更多了"
    @load="onLoad"
  >
    <van-cell
      v-for="item in list"
      :key="item.id"
      :title="item.title"
      :label="item.desc"
      is-link
      @click="goDetail(item.id)"
    />
  </van-list>
</van-pull-refresh>
```

**提取要点**：
- `@load` 是滚动到底部触发加载更多的事件，对应加载函数需记录
- `finished` 为 `true` 时表示已无更多数据
- `van-cell` 的 `title` / `label` / `value` 分别对应主标题、副标题、右侧值
- `is-link` 表示可点击跳转，需记录点击后的行为

### 1.4 底部弹出选择器

下拉选择从底部弹出：

```vue
<!-- 只读字段 + 点击唤起 -->
<van-field
  v-model="selectedLabel"
  is-link
  readonly
  label="选择项"
  placeholder="请选择"
  @click="showPicker = true"
/>
<van-popup v-model:show="showPicker" position="bottom">
  <van-picker :columns="columns" @confirm="onConfirm" @cancel="showPicker = false" />
</van-popup>
```

**提取要点**：
- `van-picker` 的 `columns` 中常用 `text`（而非 `label`）作为显示字段
- `@confirm` 返回选中项，需在回调中更新 `v-model` 绑定的值和展示文本
- 这种模式也适用于日期选择（`van-datetime-picker`）、级联选择（`van-cascader`）、日历（`van-calendar`）

### 1.5 函数式消息调用

```js
import { Toast, Notify } from 'vant'

Toast.loading({ message: '加载中...', forbidClick: true })
Toast.success('操作成功')
Toast.fail('操作失败')
Notify.show({ type: 'primary', message: '通知消息', duration: 2000 })
```


