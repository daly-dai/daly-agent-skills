# 流程速查

## 主流程

```
首次使用 → Step 1: node scan-components.mjs
         → Step 2: 展示进度，选批次
         → Step 3: 逐组件 @FILL → 写入 index.md + metadata.json
                 每 5 个暂停，人确认后继续
```

## 脚本职责

| 脚本 | 输入 | 输出 | 做的事 |
|------|------|------|--------|
| scan-components.mjs | 项目根目录 | .component-list.json | 文件发现 + Props 提取 + 引用计数 + 使用示例路径 |

脚本有边界：
- Props 只提取同文件内的 `interface XxxProps`
- 复杂类型（泛型、交叉类型、外部导入）标注 `[待确认]`
- 不做 AST 解析、不处理桶文件转发

## 文件结构

```
.ai/project-components/
├── .component-list.json          # 脚本产出：组件清单
└── components/
    └── <组件id>/
        ├── index.md              # AI 产出：组件文档
        └── metadata.json         # AI 产出 + 开发者修改
```
