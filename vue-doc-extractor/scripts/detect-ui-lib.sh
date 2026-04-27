#!/bin/bash
# 用法: detect-ui-lib.sh <project-root>
# 输出: antd / element / vant / both / unknown（多库并存时输出 both）
# 说明: 检测目标项目 package.json 中的 UI 组件库依赖

PROJECT_ROOT="${1:-.}"
PKG="$PROJECT_ROOT/package.json"

if [ ! -f "$PKG" ]; then
  echo "unknown"
  exit 0
fi

HAS_ANTD=$(grep -c '"ant-design-vue"' "$PKG")
HAS_ELEMENT=$(grep -c '"element-plus"' "$PKG")
HAS_VANT=$(grep -c '"vant"' "$PKG")

# 计算检测到的库数量
COUNT=0
[ "$HAS_ANTD" -gt 0 ] && COUNT=$((COUNT + 1))
[ "$HAS_ELEMENT" -gt 0 ] && COUNT=$((COUNT + 1))
[ "$HAS_VANT" -gt 0 ] && COUNT=$((COUNT + 1))

# 多库并存时统一输出 both
if [ "$COUNT" -gt 1 ]; then
  echo "both"
  exit 0
fi

if [ "$HAS_ANTD" -gt 0 ]; then
  echo "antd"
elif [ "$HAS_ELEMENT" -gt 0 ]; then
  echo "element"
elif [ "$HAS_VANT" -gt 0 ]; then
  echo "vant"
else
  echo "unknown"
fi
