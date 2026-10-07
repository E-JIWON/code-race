import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages는 /code-race/ 아래에서 서빙되므로 배포 빌드에서만 BASE_PATH로 경로를 바꿈
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
