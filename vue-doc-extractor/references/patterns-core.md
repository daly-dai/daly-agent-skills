# Vue 3 通用代码模式识别指南

分析 Vue SFC 源码时，用本指南识别关键代码结构。本文件包含与 UI 组件库无关的通用模式，组件库特定模式请参考 patterns-antd.md 或 patterns-element.md。

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

## 6. 路由模式

`params`→URL路径中(`/user/123`) | `query`→URL查询串(`?id=123`) | `router.back()`→返回 | `router.replace()`→替换无历史。两者在新项目路由配置方式不同，需明确记录。
