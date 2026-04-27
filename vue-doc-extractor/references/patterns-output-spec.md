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

**常量/枚举的输出规范**：

常量是迁移时必须重建的硬编码数据，**必须内联实际值**，不能只留常量名。

规则：
1. **文档中凡是引用了外部常量的位置，必须展开写明实际值**。例如选项来源列写 `[常量] STATUS_OPTIONS: [{label:'启用',value:1},{label:'禁用',value:0}]` 而非仅写 `STATUS_OPTIONS`
2. **在"常量定义"章节集中列出所有外部常量的完整定义**，作为迁移时的一次性参考
3. **标注 `[常量]` 标记**，使迁移方能快速区分常量与动态数据（API 返回的、运行时计算的）
4. 常量名本身作为业务标识应保留原名（如 `STATUS_MAP`、`ORDER_TYPE_OPTIONS`）
5. 如果常量值过长（如超过 10 个选项的列表），在引用位置可简写为 `[常量] STATUS_MAP (共12项，详见常量定义章节)`，完整值放在常量定义章节
