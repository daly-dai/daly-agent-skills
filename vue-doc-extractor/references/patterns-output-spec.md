# 框架无关输出规范

**要求**：输出文档中**禁止出现任何框架特有的代码引用和 API 调用写法**，所有实现细节必须翻译为通用描述。

**需要泛化的内容类别**：

**路由与参数**：
- 错误示例：`route.params.recordNum`、`useRoute()`、`this.$route.query.id`、`props.relateRecordNum`
- 正确示例：从路由参数获取 `recordNum`；从路由查询参数获取 `id`；从上级组件接收 `relateRecordNum`

**响应式状态**：
- 错误示例：`ref([])`、`reactive({})`、`useState([])`
- 正确示例：初始化为空数组；初始化为空对象

**生命周期**：
- 错误示例：`onMounted(() => { loadData() })`、`useEffect`
- 正确示例：页面加载时调用数据加载函数

**事件绑定**：
- 错误示例：`@click="handleSubmit"`、`@selection-change="onSelect"`
- 正确示例：点击时触发提交操作；选择变化时更新已选列表

**组件引用**：
- 错误示例：使用 `<a-modal>` 弹框、使用 `<el-dialog>` 弹框
- 正确示例：使用对话框展示详情

**保留原始信息的方式**：
对于 API 函数名、接口路径、字段名等**业务标识**，应保留原始名称（因为这些是业务含义的载体，非框架绑定），例如：
- 保留：调用 `getReportDetail(recordNum)` 获取详情数据
- 保留：字段名 `recordNum`、`reportNum`
- 保留：接口路径 `POST /api/report/detail`
