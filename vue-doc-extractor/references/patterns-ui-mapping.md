# UI 组件识别速查表

**作用**：从代码中识别出组件的**通用术语**，确保提取输出使用框架无关的描述。

**使用方式**：
1. 看到代码中的组件标签（如 `<a-input>`、`<van-field>`），在右侧各框架列中定位对应组件
2. 读取左侧的**通用术语**作为输出用语
3. 若遇到特殊交互模式（如 Vant 的底部弹出选择、Element Plus 的模板式表格列），再查阅对应的 `patterns-${lib}.md` 差异指南

> 新增组件库时，只需在右侧新增一列，无需修改场景指南和输出规范。

## 表单输入类

| 通用术语 | 识别特征 / 关键属性 | Ant Design Vue | Element Plus | Vant |
|---------|-------------------|---------------|-------------|------|
| 文本输入框 | `v-model` 绑定字符串；单行文输入 | `a-input` | `el-input` | `van-field` |
| 数字输入框 | `type="number"`、`:min`/`:max`、步进器 | `a-input-number` | `el-input-number` | `van-stepper`、`van-field type="digit"` |
| 文本域 | `type="textarea"`、多行文本、`:rows` | `a-textarea` | `el-input type="textarea"` | `van-field type="textarea"` |
| 密码输入框 | `type="password"`、密文显示 | `a-input-password` | `el-input type="password"` | `van-field type="password"`、`van-password-input` |
| 下拉选择 | 选项列表、单/多选、搜索过滤 | `a-select` | `el-select` + `el-option` | `van-picker`、`van-action-sheet` |
| 树形选择 | 树状数据结构、层级展开选择 | `a-tree-select` | `el-tree-select` | - |
| 级联选择 | 多级联动选择、级联数据 | `a-cascader` | `el-cascader` | `van-cascader` |
| 日期选择 | 日期/时间选择器、日历面板 | `a-date-picker` | `el-date-picker` | `van-calendar`、`van-datetime-picker` |
| 日期范围 | 起止日期双选 | `a-range-picker` | `el-date-picker type="daterange"` | `van-calendar type="range"` |
| 时间选择 | 时分秒选择 | `a-time-picker` | `el-time-picker` | `van-datetime-picker type="time"` |
| 单选组 | 互斥选项、圆形选择器 | `a-radio-group` | `el-radio-group` | `van-radio-group` |
| 复选组 | 多选项、方形勾选框 | `a-checkbox-group` | `el-checkbox-group` | `van-checkbox-group` |
| 开关 | 布尔切换、滑块开关 | `a-switch` | `el-switch` | `van-switch` |
| 滑块 | 拖动选择数值、范围滑块 | `a-slider` | `el-slider` | `van-slider` |
| 评分 | 星级评分 | - | - | `van-rate` |
| 步进器 | 增减按钮控制数量 | - | - | `van-stepper` |
| 颜色选择器 | 颜色面板选择 | - | `el-color-picker` | - |
| 自动补全 | 输入联想、异步搜索建议 | `a-auto-complete` | `el-autocomplete` | - |
| 文件上传 | 文件选择、上传进度、列表展示 | `a-upload` | `el-upload` | `van-uploader` |
| 搜索框 | 搜索输入、取消/清除按钮 | - | - | `van-search` |
| 省市区选择 | 三级地址联动 | - | - | `van-area` |

## 数据展示类

| 通用术语 | 识别特征 / 关键属性 | Ant Design Vue | Element Plus | Vant |
|---------|-------------------|---------------|-------------|------|
| 数据表格 | 行列数据、分页、排序、选择 | `a-table` | `el-table` | `van-list` + `van-cell`（移动端列表替代） |
| 标签页 | 多面板切换、顶部/底部导航 | `a-tabs` | `el-tabs` | `van-tabs` |
| 卡片 | 信息卡片容器、标题+内容 | `a-card` | `el-card` | `van-card` |
| 描述列表 | 键值对形式展示只读数据 | `a-descriptions` | `el-descriptions` | `van-cell-group` + `van-cell` |
| 步骤条 | 流程进度指示 | `a-steps` | `el-steps` | `van-steps` |
| 时间线 | 时间轴、事件节点 | `a-timeline` | `el-timeline` | - |
| 折叠面板 | 可展开/收起的内容区块 | `a-collapse` | `el-collapse` | `van-collapse` |
| 轮播 | 横向滑动切换内容 | - | - | `van-swipe` |
| 空状态 | 无数据占位展示 | - | `el-empty` | `van-empty` |
| 标签 | 状态标记、分类标识 | `a-tag` | `el-tag` | `van-tag` |
| 徽标 | 小红点、数字角标 | `a-badge` | `el-badge` | `van-badge` |
| 分割线 | 内容区域分隔 | - | - | `van-divider` |
| 通知栏 | 滚动通知、公告条 | - | - | `van-notice-bar` |
| 图片 | 图片展示、懒加载、适配 | - | - | `van-image` |
| 宫格 | 等分网格布局入口 | - | - | `van-grid` |
| 导航栏 | 顶部标题栏、返回按钮 | - | - | `van-nav-bar` |
| 底部标签栏 | 底部多入口导航 | - | - | `van-tabbar` |
| 侧边导航 | 左侧分类导航 | - | - | `van-sidebar` |

## 交互反馈类

| 通用术语 | 识别特征 / 关键属性 | Ant Design Vue | Element Plus | Vant |
|---------|-------------------|---------------|-------------|------|
| 对话框 | 居中弹窗、遮罩层、确认/取消 | `a-modal` | `el-dialog` | `van-dialog`、`van-popup position="center"` |
| 抽屉 | 侧滑面板、从边缘滑入 | `a-drawer` | `el-drawer` | `van-popup position="left/right"` |
| 动作面板 | 底部弹出选项菜单 | - | - | `van-action-sheet` |
| 分享面板 | 底部弹出分享渠道 | - | - | `van-share-sheet` |
| 气泡确认 | 点击后弹出确认气泡 | `a-popconfirm` | `el-popconfirm` | - |
| 轻提示 | 短暂浮现的文字提示（函数调用） | `message` | `ElMessage` | `Toast` |
| 确认对话框 | 需要用户确认操作的弹窗（函数调用） | `Modal.confirm` | `ElMessageBox` | `van-dialog` |
| 通知提醒 | 顶部/角落通知（函数调用） | `notification` | `ElNotification` | `Notify` |
| 按钮 | 点击触发操作、提交/取消/危险样式 | `a-button` | `el-button` | `van-button` |
| 图标 | 矢量图标展示 | - | - | `van-icon` |
| 加载指示 | 数据加载中的过渡状态 | - | `el-loading` | `van-loading` |
| 下拉刷新 | 列表顶部下拉触发刷新 | - | - | `van-pull-refresh` |
| 遮罩层 | 全屏半透明遮罩 | - | - | `van-overlay` |

## 业务组件

| 通用术语 | 识别特征 | Ant Design Vue | Element Plus | Vant |
|---------|---------|---------------|-------------|------|
| 提交栏 | 底部固定提交区域、价格汇总 | - | - | `van-submit-bar` |
| 商品导航 | 商品详情页底部操作栏 | - | - | `van-goods-action` |
| 地址编辑 | 收货地址表单（省市区+详情） | - | - | `van-address-edit` |
| 地址列表 | 收货地址列表管理 | - | - | `van-address-list` |
| 联系人卡片 | 联系人信息展示/编辑 | - | - | `van-contact-card` |

## 跨库差异速查

从代码中快速判断使用哪个组件库：

| 判断线索 | Ant Design Vue | Element Plus | Vant |
|---------|---------------|-------------|------|
| 组件前缀 | `a-*` | `el-*` | `van-*` |
| 表格列定义 | `:columns` 配置数组 | `<el-table-column>` 模板式 | `van-list` + `van-cell`（无传统表格） |
| 下拉选项写法 | `:options` prop 传入数组 | `<el-option>` 嵌套循环 | `van-picker` 底部弹出、`columns` prop |
| 表单字段绑定 | `a-form-item` 用 `name` | `el-form-item` 用 `prop` | `van-field` 集 label + input + 错误提示于一体 |
| 弹窗显隐控制 | `v-model:open` / `:open` | `v-model` | `v-model:show` |
| 消息提示调用 | `message.success()` | `ElMessage.success()` | `Toast.success()` |
| 日期选择交互 | 浮层日期面板 | 浮层日期面板 | 底部弹出选择器 / 日历页面 |
| 列表分页 | `a-table` + `pagination` 配置 | `el-table` + 分页组件 | `van-list` 内置无限滚动 `@load` + `finished` |
