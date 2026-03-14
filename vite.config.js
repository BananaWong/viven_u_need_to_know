import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: { port: 5173 },

  build: {
    // 目标现代浏览器，减少 polyfill 体积
    target: 'es2020',

    // 生产环境不生成 sourcemap
    sourcemap: false,

    // 单文件超过 800KB 才警告（App.jsx 本身就大）
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        // 将 React 运行时单独拆出，利用浏览器缓存
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
        },

        // 统一文件命名规则
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // 使用 esbuild 压缩（Vite 默认，速度快）
    minify: 'esbuild',
  },
})
