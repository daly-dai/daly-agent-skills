# Vue 3 通用代码模式识别指南

分析 Vue SFC 源码时，用本指南识别关键代码结构。本文件包含与 UI 组件库无关的通用模式，组件库特定模式请参考 `patterns-ui-mapping.md` 及各 `patterns-${lib}.md`。

## 1. Vue 3 Composition API

**状态声明**：`ref()`→单值 | `reactive({})`→对象(其属性即字段定义) | `computed()`→派生状态

**生命周期**：`onMounted()`→初始加载 | `watch()`→联动逻辑 | `watchEffect()`→自动追踪

**组件接口**：`defineProps()`→入参 | `defineEmits()`→事件 | `defineExpose()`→暴露方法

**Options API**：若使用，从 `data()`/`computed:{}`/`watch:{}`/`mounted()`/`methods:{}` 中提取对应信息

## 2. API 调用模式

**直接 import**：`import { getUserList } from '@/api/user'` → 记录函数名+路径

**Request 实例**：`request.get('/api/user/list', { params })` → 记录方法+URL

**Composable 封装**：`useRequest(getUserList)` → 需追入内部找实际 API

**调用时机**：onMounted→初始加载 | handleSearch→查询 | handleTableChange→翻页 | handleSubmit→提交 | handleDelete+Popconfirm→删除

## 3. 权限控制

查找：`v-auth="'user:add'"` / `v-permission` / `v-has` / `v-if="hasPermission()"` / `:disabled="!canEdit"`，以及基于状态的条件 `v-if="record.status === 'draft'"`。记录权限标识+对应操作。

## 4. TypeScript 类型

`interface`→字段名/类型/可选 | `enum`→枚举值 | `ref<Type>()`→泛型揭示字段结构

## 5. 数据流转模式（最关键）

### 5.1 页面跳转参数

```javascript
// 传递端
router.push({ name: 'Detail', params: { id: record.id } })
router.push({ path: '/edit', query: { id, type } })
// 接收端
const { id } = route.params  // 或 route.query
```

记录：跳转目标 + 传递的参数名和来源 + 方式(params/query)

### 5.2 弹窗/抽屉数据传递

```javascript
// 传整条记录: currentRecord.value = record → <Modal :record="currentRecord" />
// 传ID: currentId.value = record.id → <Modal :id="currentId" />
// 接收: const props = defineProps<{ record?: UserRecord; id?: number }>()
```

记录：传递方式(整条/仅ID/部分字段) + 具体字段 + Props定义

### 5.3 表单提交参数组装

```javascript
const submitData = {
  ...formData,
  birthday: formData.birthday?.format('YYYY-MM-DD'),  // 转换
  roleIds: formData.roles.map(r => r.id),              // 提取ID
}
delete submitData.confirmPassword                       // 排除
```

记录：直接传递的字段 | 有转换的字段(前端名→逻辑→接口名) | 被排除的字段

### 5.4 数据回显映射

```javascript
formData.name = res.data.name                           // 直接
formData.birthday = dayjs(res.data.birthday)            // 转换
formData.dept = { label: res.data.deptName, value: res.data.deptId }  // 合并
```

记录：接口字段→表单字段映射 + 转换逻辑 + 未使用字段

### 5.5 列表查询参数组装

查找 handleSearch/handleQuery，记录：搜索字段→接口参数映射 + 分页参数名(pageNo/pageSize) + 需拆分转换的字段(如dateRange拆为startDate+endDate)

### 5.6 列表响应数据

记录：列表路径(`data.list`/`data.records`) + 总数路径(`data.total`) + 其他汇总字段

## 6. 下拉/选项来源（通用）

| 来源类型 | 代码模式 | 记录方式 |
|---------|---------|---------|
| 静态定义（内联） | `[{label:'启用',value:1}]` | 列出所有选项 |
| 静态定义（外部常量） | `import { OPTIONS } from './constants'` | 标注 `[常量]`，内联实际值（见第8节） |
| API 加载 | `onMounted→fetchOptions()` | API函数名 |
| 字典服务 | `useDictStore().getDict('code')` | 字典编码 |
| Store | `useXxxStore().xxxList` | Store名+属性 |


## 7. 路由模式

`params`→URL路径中(`/user/123`) | `query`→URL查询串(`?id=123`) | `router.back()`→返回 | `router.replace()`→替换无历史。两者在新项目路由配置方式不同，需明确记录。

## 8. 常量与枚举识别（关键）

页面中 import 的常量/枚举是迁移时不可或缺的信息。**必须追踪到定义位置，将实际值完整内联到文档中**，不能只记录常量名。

### 8.1 常见 import 模式

```javascript
// 从专用常量文件 import
import { STATUS_MAP, TYPE_OPTIONS } from './constants'
import { COLUMNS } from './columns'
import { OrderStatus } from '@/enums/order'
// 从 composable/config 文件 import
import { FORM_RULES } from './config'
import { PAGE_SIZE, MAX_UPLOAD } from '@/constants/common'
// 解构 import 或默认 import
import DICT_CODES from '@/constants/dict'
```

### 8.2 常量类型与提取要求

| 常量类型 | 代码特征 | 提取要求 |
|---------|---------|---------|
| 状态/类型映射 | `{ 1: '启用', 2: '禁用' }` 或 `Map` | 列出所有 key→value 对 |
| 选项列表 | `[{ label: '类型A', value: 1 }]` | 列出所有选项的 label+value |
| 表格列定义 | `[{ title: '名称', dataIndex: 'name' }]` | 列出列标题+字段名+特殊渲染 |
| 枚举 | `enum Status { DRAFT='draft' }` | 列出所有枚举成员名+值 |
| 校验正则 | `const PHONE_REG = /^1[3-9]\d{9}$/` | 记录正则+用途说明 |
| 配置常量 | `const PAGE_SIZE = 10` | 记录值+用途 |
| 字典编码 | `const DICT_CODE = 'sys_status'` | 记录编码值+对应字典 |

### 8.3 追踪规则

1. 扫描 `<script>` 中所有 `import`，识别来自 `constants`、`enums`、`config`、`dict`、`columns` 等路径的导入
2. 对每个常量 import：**读取源文件**，提取对应常量的完整定义
3. 如果常量值是从另一处再次 import 的（二级引用），继续追踪直到找到实际值
4. 将常量实际值内联到文档中使用该常量的位置（如选项来源列、状态映射、列定义等）
5. 如果常量文件过大（>50个常量），只提取当前页面实际使用的常量


### 8.4 提取边界 — 何时停止追踪并标注 `[待补充]`

遇到以下情况，**立即停止追踪**，在常量定义章节标注 `[待补充]`，不要继续递归：

| 情况 | 示例 | 处理方式 |
|------|------|---------|
| 值是函数调用的结果（非字面量） | `const X = generateMap()` | 记录函数名，标注 `[待补充: 需人工查看 generateMap 定义]` |
| 值来自第三方 npm 包 | `export { format } from 'date-fns'` | 标注 `[待补充: 第三方库，迁移时 npm install 引入]` |
| 函数实现超过 50 行 | 300 行的校验函数 | 记录功能说明，标注 `[待补充: 函数实现较长({N}行)，需人工迁移]` |
| 追踪链路超过 2 层 | `order.ts -> useOrder.ts -> request.ts` | 停止追踪，标注 `[待补充: 追踪链过长(A->B->C)，请查看源文件 C]` |
| 值在运行时动态计算 | 依赖 `useStore()` 返回值的常量 | 标注 `[待补充: 运行时动态生成，无法静态提取]` |

> ⚠️ **关键**：判断的核心标准是「能否在当前文件中静态确定完整值」。能 → 提取；不能 → `[待补充]`。不要在追踪链中浪费轮次。

## 9. Vue 代码模式 → 输出术语翻译规则（🛑 强制）

> 以下规则用于**输出阶段**。识别阶段可以用任何 Vue 术语思考，但填 @FILL 标记时必须按此表翻译。

### 9.1 状态与响应式

| Vue 代码中的模式 | 输出中必须翻译为 |
|-----------------|---------------|
| `ref(xxx)` | "页面状态 xxx" |
| `reactive({...})` | "页面状态对象" |
| `computed(() => ...)` | "派生数据" |
| `watch(xxx, () => ...)` | "联动规则：当 xxx 变化时执行 yyy" |
| `watchEffect(() => ...)` | "自动追踪的联动逻辑" |
| `defineProps<{...}>()` | "组件接收的参数" |
| `defineEmits([...])` | "组件对外触发的事件" |
| `defineExpose({...})` | "组件暴露的方法/属性" |

### 9.2 生命周期

| Vue 代码中的模式 | 输出中必须翻译为 |
|-----------------|---------------|
| `onMounted(() => ...)` | "页面加载时执行" |
| `onUnmounted(() => ...)` | "页面销毁时执行" |
| `onBeforeUnmount(() => ...)` | "页面销毁前执行" |

### 9.3 路由与导航

| Vue 代码中的模式 | 输出中必须翻译为 |
|-----------------|---------------|
| `router.push({ name: 'Xxx', params: {...} })` | "跳转到 Xxx 页面，传递参数 {...}" |
| `router.push({ path: '/xxx', query: {...} })` | "跳转到 /xxx，传递查询参数 {...}" |
| `router.back()` | "返回上一页" |
| `router.replace(...)` | "替换当前页面（无浏览器历史）" |
| `route.params.id` | "从 URL 路径参数获取 id" |
| `route.query.id` | "从 URL 查询参数获取 id" |
| `useRoute()` | "获取当前路由信息" |

### 9.4 组件与交互

| Vue 代码中的模式 | 输出中必须翻译为 |
|-----------------|---------------|
| `<a-modal>` / `<el-dialog>` / `<van-popup position="center">` | "弹窗 / 对话框" |
| `<a-drawer>` / `<el-drawer>` | "侧边抽屉" |
| `<a-table>` / `<el-table>` / `<van-list>` | "数据列表" |
| `<a-form>` / `<el-form>` / `<van-form>` | "表单" |
| `<a-form-item>` / `<el-form-item>` / `<van-field>` | "表单字段" |
| `<a-tabs>` / `<el-tabs>` | "标签页" |
| `<a-pagination>` / `<el-pagination>` | "分页" |
| `v-model="xxx"` | "双向绑定到 xxx" |
| `v-if="condition"` | "当 condition 满足时显示" |
| `v-show="condition"` | "当 condition 满足时可见" |
| `v-for="item in list"` | "遍历 list" |
| `@click="handler"` | "点击时触发 handler" |
| `@change="handler"` | "值变化时触发 handler" |

### 9.5 消息与提示

| Vue 代码中的模式 | 输出中必须翻译为 |
|-----------------|---------------|
| `message.success(...)` / `ElMessage.success(...)` | "操作成功提示" |
| `message.error(...)` / `ElMessage.error(...)` | "操作失败提示" |
| `Modal.confirm(...)` / `ElMessageBox.confirm(...)` | "确认对话框" |
| `notification.open(...)` / `ElNotification(...)` | "通知提醒" |

### 9.6 路径翻译规则

| Vue 项目中的路径 | 输出中处理方式 |
|-----------------|-------------|
| `src/views/order/OrderList.vue` | **不输出路径**，只输出页面名称"订单列表页" |
| `src/api/order.ts` | **不输出路径**，只输出"订单模块接口" |
| `@/api/user` | **不输出** |
| `@/enums/order` | **不输出路径**，将枚举值内联到数据模型章节 |
| `./components/OrderForm.vue` | **不输出路径**，只输出"订单表单弹窗组件" |
| `./constants.ts` | **不输出路径**，将常量值内联，标注 `[常量]` |
| `src/composables/useOrder.ts` | **不输出路径**，只输出功能说明 |

### 9.7 🛑 输出中绝对禁止出现的内容

1. **任何 UI 组件库的标签名**：`a-*`、`el-*`、`van-*`、`ant-*`
2. **任何框架 API**：`ref`、`reactive`、`computed`、`watch`、`defineProps`、`defineEmits`
3. **任何路由 API**：`router.push`、`route.params`、`useRoute`
4. **任何文件路径**：包含 `src/`、`@/`、`./`、`../` 的路径字符串
5. **任何框架指令**：`v-if`、`v-show`、`v-model`、`v-for`、`@click`
6. **任何生命周期函数名**：`onMounted`、`onUnmounted`
7. **任何框架消息函数**：`message.success`、`ElMessage`、`Modal.confirm`
