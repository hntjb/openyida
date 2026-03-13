#!/usr/bin/env sh
# install-skills.sh - 安装 yida-skills 子模块
#
# 兼容：macOS / Linux（sh/bash/zsh）
# Windows 用户请使用：install-skills.ps1
#
# 用法：
#   bash install-skills.sh
#   sh install-skills.sh

set -e

SKILLS_DIR=".claude/skills"
SUBMODULE_URL="https://github.com/openyida/yida-skills.git"

echo "🔧 正在安装 yida-skills..."

# 检查是否在项目根目录（有 .git 或 config.json）
if [ ! -f "config.json" ] && [ ! -d ".git" ]; then
  echo "❌ 请在项目根目录下运行此脚本"
  exit 1
fi

# 方式一：通过 git submodule 初始化（推荐，已克隆仓库时使用）
if [ -f ".gitmodules" ]; then
  echo "📦 检测到 .gitmodules，通过 git submodule 初始化..."
  git submodule update --init --recursive
  echo "✅ Skills 安装完成：${SKILLS_DIR}/skills/"
  exit 0
fi

# 方式二：直接 clone（未使用 submodule 时的备用方案）
if [ -d "${SKILLS_DIR}" ]; then
  echo "📦 ${SKILLS_DIR} 已存在，跳过克隆"
else
  echo "📦 克隆 yida-skills 到 ${SKILLS_DIR}..."
  git clone "${SUBMODULE_URL}" "${SKILLS_DIR}"
fi

echo "✅ Skills 安装完成：${SKILLS_DIR}/skills/"
echo ""
echo "已安装的 Skills："
if [ -d "${SKILLS_DIR}/skills" ]; then
  for skill_dir in "${SKILLS_DIR}/skills"/*/; do
    skill_name=$(basename "${skill_dir}")
    echo "  - ${skill_name}"
  done
else
  echo "  （未找到 skills 子目录）"
fi
