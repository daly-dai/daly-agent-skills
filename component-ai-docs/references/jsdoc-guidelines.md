# JSDoc 写法规范（给 AI 看的）

> 目标：让 AI 看到 JSDoc 就知道字段怎么用。

## Props 顶层 JSDoc

```
/**
 * SSearchTable 搜索表格组件 Props
 *
 * 集成 SForm.Search + STable 的一体化组件，是管理后台列表页的首选方案。
 * 自动处理搜索、分页、数据加载的联动逻辑。
 *
 * @example
 * <SSearchTable
 *   requestFn={async (params) => ({ dataList, totalSize })}
 *   formProps={{ items: [...], columns: 3 }}
 *   tableProps={{ columns: [...], rowKey: 'id' }}
 * />
 */
```

要点：一句话定位 + 核心能力 + 最小可运行示例。

## 属性级 JSDoc

```
好：
  /** 数据请求函数。接收搜索参数+分页参数，返回 { dataList, totalSize } */
  requestFn: (data?: any) => Promise<any>;

  /** 搜索表单列数，默认 3 */
  columns?: number;

  /** 表格区域标题。不传则无标题栏 */
  tableTitle?: STitleProps;

差：
  /** 请求函数 */
  requestFn: Function;

  /** columns */
  columns?: number;
```

## 规则

- 说清楚"什么时候需要设这个字段"和"不设会怎样"
- 引用其他类型时说明"来自哪个组件/接口"
- 默认值必须写明
- 必填字段可以简短，但必须说清楚用途
