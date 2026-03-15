#!/bin/bash
#
# React 前端快速设置脚本
# 自动创建前端项目并安装所有依赖
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$BASE_DIR/frontend"

echo "================================================="
echo "🚀 React Frontend Setup Script"
echo "================================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "Please install Node.js: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION found"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found!"
    exit 1
fi

echo "✅ npm $(npm -v) found"
echo ""

# 创建前端项目
if [ -d "$FRONTEND_DIR" ]; then
    echo "⚠️  Frontend directory already exists"
    read -p "Do you want to remove and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$FRONTEND_DIR"
    else
        echo "Aborted."
        exit 0
    fi
fi

echo "📦 Creating React + TypeScript project..."
cd "$BASE_DIR"
npm create vite@latest frontend -- --template react-ts

cd "$FRONTEND_DIR"

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "📦 Installing additional packages..."
npm install \
  axios \
  @tanstack/react-query \
  lucide-react \
  clsx \
  tailwind-merge

npm install -D \
  tailwindcss \
  postcss \
  autoprefixer \
  @types/node

echo ""
echo "⚙️  Configuring Tailwind CSS..."
npx tailwindcss init -p

# 创建 Tailwind 配置
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      }
    },
  },
  plugins: [],
}
EOF

# 创建环境变量文件
cat > .env.development << 'EOF'
VITE_API_URL=http://localhost:5001
EOF

cat > .env.production << 'EOF'
VITE_API_URL=https://api.waterquality.com
EOF

# 创建目录结构
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/lib

echo ""
echo "================================================="
echo "✅ Setup Complete!"
echo "================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend (in another terminal):"
echo "   cd ca-water-quality"
echo "   python src/app.py"
echo ""
echo "2. Start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "📚 Read the full guide: docs/REACT_MIGRATION_GUIDE.md"
echo ""
