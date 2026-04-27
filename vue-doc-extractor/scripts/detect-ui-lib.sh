#!/bin/bash
# 用法: detect-ui-lib.sh <project-root>
# 输出: 空格分隔的库标识列表，如 "antd" / "element" / "vant" / "antd element" / "unknown"
# 说明: 检测目标项目 package.json 中的 UI 组件库依赖

PROJECT_ROOT="${1:-.}"
PKG="$PROJECT_ROOT/package.json"

if [ ! -f "$PKG" ]; then
  echo "unknown"
  exit 0
fi

RESULT=""

HAS_ANTD=$(grep -c '"ant-design-vue"' "$PKG")
HAS_ELEMENT=$(grep -c '"element-plus"' "$PKG")
HAS_VANT=$(grep -c '"vant"' "$PKG")

[ "$HAS_ANTD" -gt 0 ] && RESULT="${RESULT} antd"
[ "$HAS_ELEMENT" -gt 0 ] && RESULT="${RESULT} element"
[ "$HAS_VANT" -gt 0 ] && RESULT="${RESULT} vant"

# 去除前导空格并输出
RESULT=$(echo "$RESULT" | sed 's/^ *//')

if [ -z "$RESULT" ]; then
  echo "unknown"
else
  echo "$RESULT"
fi
