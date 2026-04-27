# Vant 组件识别指南

识别 Vant (van-* 前缀) 组件的使用方式。配合 patterns-core.md 使用。

## 1. Vant 组件识别

### 表单组件

| 组件 | 通用术语 | 关键属性 |
|-----|---------|---------|
| `van-form` | 表单容器 | `@submit` `@failed` |
| `van-field` | 表单项/输入框 | `v-model` `label` `name` `placeholder` `rules` `type` `required` `readonly` `disabled` |
| `van-field type="digit"` | 数字输入框 | `type="digit"` `type="number"` |
| `van-field type="textarea"` | 多行文本框 | `type="textarea"` `rows` `autosize` |
| `van-field type="password"` | 密码输入框 | `type="password"` |
| `van-radio-group` / `van-radio` | 单选组 | `v-model` `direction` |
| `van-checkbox-group` / `van-checkbox` | 多选组 | `v-model` `max` |
| `van-switch` | 开关 | `v-model` `active-color` `inactive-color` |
| `van-stepper` | 步进器（数字输入） | `v-model` `min` `max` `step` `disabled` |
| `van-rate` | 评分 | `v-model` `count` `readonly` |
| `van-slider` | 滑块 | `v-model` `min` `max` `step` `range` |
| `van-uploader` | 文件上传 | `v-model:file-list` `accept` `multiple` `max-count` `:after-read` |
| `van-picker` | 选择器 | `columns` `value-key` `@confirm` `@cancel` |
| `van-datetime-picker` | 日期时间选择 | `v-model` `type` `min-date` `max-date` `@confirm` |
| `van-calendar` | 日历选择 | `v-model:show` `type` `min-date` `max-date` `@confirm` |
| `van-cascader` | 级联选择 | `v-model` `options` `field-names` `@finish` |
| `van-password-input` | 密码输入框 | `value` `length` `focused` |
| `van-area` | 省市区选择 | `area-list` `columns-num` `@confirm` |
| `van-search` | 搜索框 | `v-model` `placeholder` `@search` `@cancel` `show-action` |

### 列表与展示组件

Vant 移动端场景下不常用传统表格，列表展示通常由以下组件组合实现：

| 组件/配置 | 通用术语 | 关键属性 |
|----------|---------|---------|
| `van-list` | 长列表/滚动加载列表 | `v-model:loading` `v-model:error` `finished` `@load` `offset` |
| `van-cell` / `van-cell-group` | 单元格/单元格组 | `title` `label` `value` `is-link` `to` `icon` `border` |
| `van-card` | 卡片 | `title` `desc` `thumb` `price` `num` `tag` |
| `van-tag` | 标签 | `type` `color` `plain` `round` `mark` |
| `van-badge` | 徽标 | `:content` `max` `dot` |
| `van-image` | 图片 | `src` `fit` `round` `lazy-load` |
| `van-empty` | 空状态 | `description` `image` |
| `van-notice-bar` | 通知栏 | `text` `mode` `color` `background` `scrollable` |
| `van-swipe` / `van-swipe-item` | 轮播/滑动视图 | `autoplay` `loop` `indicator-color` `@change` |
| `van-steps` / `van-step` | 步骤条 | `active` `direction` `active-icon` |
| `van-collapse` / `van-collapse-item` | 折叠面板 | `v-model` `accordion` `title` `name` |
| `van-divider` | 分割线 | `content-position` `dashed` `hairline` |

### 导航组件

| 组件 | 用途 |
|-----|------|
| `van-nav-bar` | 导航栏，`title` `left-text` `right-text` `@click-left` `@click-right` |
| `van-tabbar` / `van-tabbar-item` | 底部标签栏，`v-model` `active-color` `inactive-color` |
| `van-tabs` / `van-tab` | 标签页，`v-model:active` `type` `sticky` `swipeable` `@change` |
| `van-sidebar` / `van-sidebar-item` | 侧边导航，`v-model` |

### 交互与反馈组件

| 组件 | 用途 |
|-----|------|
| `van-popup` | 弹出层（底层组件），`v-model:show` `position` `round` `closeable` `overlay` |
| `van-dialog` | 对话框（基于 popup），`v-model:show` `title` `message` `show-cancel-button` `@confirm` |
| `van-action-sheet` | 动作面板（底部弹出选项），`v-model:show` `actions` `cancel-text` `@select` |
| `van-share-sheet` | 分享面板，`v-model:show` `options` `@select` |
| `van-toast` | 轻提示（函数调用），`Toast.loading/success/fail/clear()` |
| `van-notify` | 消息通知（函数调用），`Notify.show/clear()` `type` `message` `duration` |
| `van-loading` | 加载指示，`type` `size` `color` `vertical` |
| `van-pull-refresh` | 下拉刷新，`v-model` `@refresh` `success-text` `success-duration` |
| `van-overlay` | 遮罩层，`v-model:show` `@click` `z-index` |
| `van-button` | 按钮，`type` `size` `plain` `round` `block` `loading` `disabled` `@click` |
| `van-icon` | 图标，`name` `size` `color` `badge` `dot` |
| `van-grid` / `van-grid-item` | 宫格，`icon` `text` `@click` |

### 业务组件

| 组件 | 用途 |
|-----|------|
| `van-submit-bar` | 提交订单栏，`price` `button-text` `@submit` `tip` |
| `van-goods-action` / `van-goods-action-button` / `van-goods-action-icon` | 商品导航 |
| `van-address-edit` | 地址编辑，`area-list` `show-delete` `@save` `@delete` |
| `van-address-list` | 地址列表，`list` `v-model` `@add` `@edit` `@select` |
| `van-contact-card` / `van-contact-edit` / `van-contact-list` | 联系人卡片/编辑/列表 |

## 2. Vant 与桌面端组件库的关键差异

识别 Vant 代码时，注意以下与 Ant Design Vue / Element Plus 的差异：

| 差异点 | Vant | 桌面端组件库 |
|-------|------|-------------|
| 表格 | 无传统表格，使用 `van-list` + `van-cell` 组合实现列表 | `a-table` / `el-table` 配置式/模板式表格 |
| 弹窗层 | `van-popup` 为底层弹出层，`position` 控制方向（center/top/bottom/left/right） | `a-modal` / `el-dialog` 居中对话框，`a-drawer` / `el-drawer` 抽屉 |
| 表单字段 | `van-field` 集 label + input + 校验提示于一体，是核心表单组件 | `a-form-item` / `el-form-item` 包裹 input，职责分离 |
| 下拉选择 | 使用 `van-picker` 或 `van-action-sheet` 从底部弹出选择 | `a-select` / `el-select` 下拉浮层 |
| 日期选择 | 使用 `van-calendar` 日历面板 或 `van-datetime-picker` 底部选择器 | `a-date-picker` / `el-date-picker` 浮层选择 |
| 列表加载 | `van-list` 内置无限滚动加载（`@load` + `finished`） | 需自行实现分页或滚动加载 |
| 下拉刷新 | `van-pull-refresh` 组件化封装 | 通常需自行监听 touch 事件实现 |
| 轻提示 | `Toast.success()` 函数调用，全局单例 | `message.success()` / `ElMessage.success()` |
| 搜索框 | `van-search` 为独立完整组件，含输入框+取消按钮 | 通常为 `a-input` / `el-input` + `suffix` 组合 |

## 3. Vant 表单与列表常见模式

### 表单模式

```vue
<!-- 基础表单 -->
<van-form @submit="onSubmit" @failed="onFailed">
  <van-field
    v-model="form.name"
    name="name"
    label="用户名"
    placeholder="请输入用户名"
    :rules="[{ required: true, message: '请填写用户名' }]"
  />
  <van-field
    v-model="form.phone"
    name="phone"
    label="手机号"
    type="tel"
    :rules="[{ pattern: /^1\d{10}$/, message: '手机号格式错误' }]"
  />
  <div style="margin: 16px;">
    <van-button round block type="primary" native-type="submit">提交</van-button>
  </div>
</van-form>
```

### 列表模式（无限滚动）

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

### 底部弹出选择

```vue
<van-field
  v-model="selectedLabel"
  is-link
  readonly
  label="选择项"
  placeholder="请选择"
  @click="showPicker = true"
/>
<van-popup v-model:show="showPicker" position="bottom">
  <van-picker
    :columns="columns"
    @confirm="onConfirm"
    @cancel="showPicker = false"
  />
</van-popup>
```

## 4. 下拉/选项来源

| 来源类型 | 代码模式 | 记录方式 |
|---------|---------|---------|
| 静态定义 | `[{text:'启用',value:1}]`（Vant picker 常用 `text` 作为显示字段） | 列出所有选项 |
| API 加载 | `onMounted→fetchOptions()` | API函数名 |
| 字典服务 | `useDictStore().getDict('code')` | 字典编码 |
| Store | `useXxxStore().xxxList` | Store名+属性 |

## 5. 特别注意

- `van-field` 是 Vant 表单中最核心的组件，它同时承担 label 展示、输入框本体、校验错误提示三重职责。提取时要关注其 `rules`、`type`、`placeholder`、`readonly`、`disabled` 等属性
- `van-popup` 是 Vant 所有弹出层的底层组件，`position` 属性决定弹出方向：`center`（对话框）、`bottom`（底部弹出/选择器）、`top`/`left`/`right`（侧滑）。很多组件如 `van-dialog`、`van-action-sheet`、`van-picker` 默认都在 popup 内使用
- 移动端列表页通常由 `van-pull-refresh` + `van-list` + `van-cell` 三层结构组成，取代了桌面端的 "查询表单 + 表格 + 分页" 模式
- `van-toast` 和 `van-notify` 是函数式调用组件，在代码中通常以 `Toast.success('消息')`、`Notify.show({ type: 'primary', message: '通知' })` 的形式出现
