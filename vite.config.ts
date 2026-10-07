import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// cloudflare(): 개발·미리보기에서도 방 서버(Durable Object)를 로컬로 같이 띄움
export default defineConfig({
  plugins: [react(), cloudflare()],
})
