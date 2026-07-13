import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  base: "/quiz/",

  server: {
    allowedHosts: [
      "48d2-91-181-120-70.ngrok-free.app"
    ]
  }
});