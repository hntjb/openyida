# install-skills.ps1 - 安装 yida-skills 子模块（Windows PowerShell）
#
# 兼容：Windows PowerShell 5.1+ / PowerShell Core 7+
# Mac/Linux 用户请使用：install-skills.sh
#
# 用法：
#   .\install-skills.ps1
#   PowerShell -ExecutionPolicy Bypass -File install-skills.ps1

$ErrorActionPreference = "Stop"

$SkillsDir = ".claude\skills"
$SubmoduleUrl = "https://github.com/openyida/yida-skills.git"

Write-Host "🔧 正在安装 yida-skills..." -ForegroundColor Cyan

# 检查是否在项目根目录（有 .git 或 config.json）
if (-not (Test-Path "config.json") -and -not (Test-Path ".git")) {
    Write-Host "❌ 请在项目根目录下运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查 git 是否可用
try {
    git --version | Out-Null
} catch {
    Write-Host "❌ 未找到 git，请先安装 Git for Windows：https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# 方式一：通过 git submodule 初始化（推荐，已克隆仓库时使用）
if (Test-Path ".gitmodules") {
    Write-Host "📦 检测到 .gitmodules，通过 git submodule 初始化..." -ForegroundColor Yellow
    git submodule update --init --recursive
    Write-Host "✅ Skills 安装完成：$SkillsDir\skills\" -ForegroundColor Green
    exit 0
}

# 方式二：直接 clone（未使用 submodule 时的备用方案）
if (Test-Path $SkillsDir) {
    Write-Host "📦 $SkillsDir 已存在，跳过克隆" -ForegroundColor Yellow
} else {
    Write-Host "📦 克隆 yida-skills 到 $SkillsDir..." -ForegroundColor Yellow
    git clone $SubmoduleUrl $SkillsDir
}

Write-Host "✅ Skills 安装完成：$SkillsDir\skills\" -ForegroundColor Green
Write-Host ""
Write-Host "已安装的 Skills：" -ForegroundColor Cyan

$SkillsSubDir = Join-Path $SkillsDir "skills"
if (Test-Path $SkillsSubDir) {
    Get-ChildItem -Path $SkillsSubDir -Directory | ForEach-Object {
        Write-Host "  - $($_.Name)"
    }
} else {
    Write-Host "  （未找到 skills 子目录）" -ForegroundColor Yellow
}
