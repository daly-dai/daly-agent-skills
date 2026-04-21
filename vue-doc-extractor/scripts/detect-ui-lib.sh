#!/bin/bash
# 用法: detect-ui-lib.sh <project-root>
# 输出: antd / element / both / unknown
# 说明: 检测目标项目 package.json 中的 UI 组件库依赖

PROJECT_ROOT="${1:-.}"
PKG="$PROJECT_ROOT/package.json"

if [ ! -f "$PKG" ]; then
  echo "unknown"
  exit 0
fi

HAS_ANTD=$(grep -c '"ant-design-vue"' "$PKG")
HAS_ELEMENT=$(grep -c '"element-plus"' "$PKG")

if [ "$HAS_ANTD" -gt 0 ] && [ "$HAS_ELEMENT" -gt 0 ]; then
  echo "both"
elif [ "$HAS_ANTD" -gt 0 ]; then
  echo "antd"
elif [ "$HAS_ELEMENT" -gt 0 ]; then
  echo "element"
else
  echo "unknown"
fi
