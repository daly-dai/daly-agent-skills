# UI 组件识别速查表

**作用**：从代码中识别出组件的**通用术语**，确保提取输出使用框架无关的描述。

**使用方式**：
1. 看到代码中的组件标签（如 `<a-input>`、`<van-field>`），在右侧各框架列中定位对应组件
2. 读取左侧的**通用术语**作为输出用语
3. 若遇到特殊交互模式（如 Element Plus 的模板式表格列），再查阅对应的 `patterns-${lib}.md` 差异指南

> 新增组件库时，只需在右侧新增一列，无需修改场景指南和输出规范。

## 表单输入类

| 通用术语 | 识别特征 / 关键属性 | Ant Design Vue | Element Plus |
|---------|-------------------|---------------|-------------|------|
| 文本输入框 | `v-model` 绑定字符串；单行文输入 | `a-input` | `el-input` |
| 数字输入框 | `type="number"`、`:min`/`:max`、步进器 | `a-input-number` | `el-input-number` |
| 文本域 | `type="textarea"`、多行文本、`:rows` | `a-textarea` | `el-input type="textarea"` |
| 密码输入框 | `type="password"`、密文显示 | `a-input-password` | `el-input type="password"` |
| 下拉选择 | 选项列表、单/多选、搜索过滤 | `a-select` | `el-select` + `el-option` |
| 树形选择 | 树状数据结构、层级展开选择 | `a-tree-select` | `el-tree-select` | - |
| 级联选择 | 多级联动选择、级联数据 | `a-cascader` | `el-cascader` |
| 日期选择 | 日期/时间选择器、日历面板 | `a-date-picker` | `el-date-picker` |
| 日期范围 | 起止日期双选 | `a-range-picker` | `el-date-picker type="daterange"` |
| 时间选择 | 时分秒选择 | `a-time-picker` | `el-time-picker` |
| 单选组 | 互斥选项、圆形选择器 | `a-radio-group` | `el-radio-group` |
| 复选组 | 多选项、方形勾选框 | `a-checkbox-group` | `el-checkbox-group` |
| 开关 | 布尔切换、滑块开关 | `a-switch` | `el-switch` |
| 滑块 | 拖动选择数值、范围滑块 | `a-slider` | `el-slider` |
| 评分 | 星级评分 | - | - |
| 步进器 | 增减按钮控制数量 | - | - |
| 颜色选择器 | 颜色面板选择 | - | `el-color-picker` | - |
| 自动补全 | 输入联想、异步搜索建议 | `a-auto-complete` | `el-autocomplete` | - |
| 文件上传 | 文件选择、上传进度、列表展示 | `a-upload` | `el-upload` |
| 搜索框 | 搜索输入、取消/清除按钮 | - | - |
| 省市区选择 | 三级地址联动 | - | - |

## 数据展示类

| 通用术语 | 识别特征 / 关键属性 | Ant Design Vue | Element Plus |
|---------|-------------------|---------------|-------------|------|
| 数据表格 | 行列数据、分页、排序、选择 | `a-table` | `el-table` |
| 标签页 | 多面板切换、顶部/底部导航 | `a-tabs` | `el-tabs` |
| 卡片 | 信息卡片容器、标题+内容 | `a-card` | `el-card` |
| 描述列表 | 键值对形式展示只读数据 | `a-descriptions` | `el-descriptions` |
| 步骤条 | 流程进度指示 | `a-steps` | `el-steps` |
| 时间线 | 时间轴、事件节点 | `a-timeline` | `el-timeline` | - |
| 折叠面板 | 可展开/收起的内容区块 | `a-collapse` | `el-collapse` |
| 轮播 | 横向滑动切换内容 | - | - |
| 空状态 | 无数据占位展示 | - | `el-empty` |
| 标签 | 状态标记、分类标识 | `a-tag` | `el-tag` |
| 徽标 | 小红点、数字角标 | `a-badge` | `el-badge` |
| 分割线 | 内容区域分隔 | - | - |
| 通知栏 | 滚动通知、公告条 | - | - |
| 图片 | 图片展示、懒加载、适配 | - | - |
| 宫格 | 等分网格布局入口 | - | - |
| 导航栏 | 顶部标题栏、返回按钮 | - | - |
| 底部标签栏 | 底部多入口导航 | - | - |
| 侧边导航 | 左侧分类导航 | - | - |

## 交互反馈类

| 通用术语 | 识别特征 / 关键属性 | Ant Design Vue | Element Plus |
|---------|-------------------|---------------|-------------|------|
| 对话框 | 居中弹窗、遮罩层、确认/取消 | `a-modal` | `el-dialog` |
| 抽屉 | 侧滑面板、从边缘滑入 | `a-drawer` | `el-drawer` |
| 动作面板 | 底部弹出选项菜单 | - | - |
| 分享面板 | 底部弹出分享渠道 | - | - |
| 气泡确认 | 点击后弹出确认气泡 | `a-popconfirm` | `el-popconfirm` | - |
| 轻提示 | 短暂浮现的文字提示（函数调用） | `message` | `ElMessage` | `Toast` |
| 确认对话框 | 需要用户确认操作的弹窗（函数调用） | `Modal.confirm` | `ElMessageBox` |
| 通知提醒 | 顶部/角落通知（函数调用） | `notification` | `ElNotification` | `Notify` |
| 按钮 | 点击触发操作、提交/取消/危险样式 | `a-button` | `el-button` |
| 图标 | 矢量图标展示 | - | - |
| 加载指示 | 数据加载中的过渡状态 | - | `el-loading` |
| 下拉刷新 | 列表顶部下拉触发刷新 | - | - |
| 遮罩层 | 全屏半透明遮罩 | - | - |

## 业务组件

| 通用术语 | 识别特征 | Ant Design Vue | Element Plus |
|---------|---------|---------------|-------------|------|
| 提交栏 | 底部固定提交区域、价格汇总 | - | - |
| 商品导航 | 商品详情页底部操作栏 | - | - |
| 地址编辑 | 收货地址表单（省市区+详情） | - | - |
| 地址列表 | 收货地址列表管理 | - | - |
| 联系人卡片 | 联系人信息展示/编辑 | - | - |

## 跨库差异速查

从代码中快速判断使用哪个组件库：

| 判断线索 | Ant Design Vue | Element Plus |
|---------|---------------|-------------|------|
| 组件前缀 | `a-*` | `el-*` |
| 表格列定义 | `:columns` 配置数组 | `<el-table-column>` 模板式 |
| 下拉选项写法 | `:options` prop 传入数组 | `<el-option>` 嵌套循环 |
| 表单字段绑定 | `a-form-item` 用 `name` | `el-form-item` 用 `prop` |
| 弹窗显隐控制 | `v-model:open` / `:open` | `v-model` | `v-model:show` |
| 消息提示调用 | `message.success()` | `ElMessage.success()` | `Toast.success()` |
| 日期选择交互 | 浮层日期面板 | 浮层日期面板 | 底部弹出选择器 / 日历页面 |
| 列表分页 | `a-table` + `pagination` 配置 | `el-table` + 分页组件 |
