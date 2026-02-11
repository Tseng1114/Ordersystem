import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        create_event: resolve(__dirname, 'create_event.html'),
        order: resolve(__dirname, 'order.html'),
        summary: resolve(__dirname, 'summary.html')
      }
    }
  }
})