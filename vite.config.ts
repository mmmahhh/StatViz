/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false, // 禁用 CSS 处理以节省内存
    // 性能与内存优化配置
    pool: 'forks', // 使用进程池隔离环境
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 1, // 强制串行执行，避免并发导致的内存峰值
      },
    },
    isolate: true, // 启用隔离，确保每个文件结束后销毁 JSDOM
    logHeapUsage: true,
  },
})
