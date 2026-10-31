import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    proxy: {
      // 开发环境通过代理访问后端，规避浏览器 CORS 限制
      '/api': {
        target: 'https://api.travel-note.acmsmu.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
