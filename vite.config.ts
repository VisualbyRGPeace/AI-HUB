import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' => chạy được ở username.github.io/<repo>/ mà không hardcode tên repo
export default defineConfig({ base: './', plugins: [react()] })
