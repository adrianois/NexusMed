import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  // Proxy removido: não funciona no Codespaces pois o browser acessa
  // as portas por URLs públicas distintas. A detecção automática
  // de ambiente está em src/api.js (função resolveBaseURL).
})
