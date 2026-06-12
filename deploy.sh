#!/bin/bash
echo "========================================="
echo "  MindPilot Vercel 一键部署"
echo "========================================="

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 未安装 Vercel CLI，正在安装..."
    npm i -g vercel
fi

# 检查登录状态
echo "📋 检查登录状态..."
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ 未登录 Vercel，请先执行：vercel login"
    exit 1
fi

echo "✅ 已登录 Vercel"

# 部署
echo "🚀 开始部署..."
cd "$(dirname "$0")"
vercel --prod

echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "下一步："
echo "1. 打开 https://vercel.com/dashboard"
echo "2. 点击 mindpilot 项目"
echo "3. Settings → Domains → 添加你的域名"
echo ""
