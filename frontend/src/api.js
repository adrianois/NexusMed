import axios from 'axios'

/**
 * Resolve a baseURL da API em qualquer ambiente:
 *
 * 1. Se VITE_API_URL estiver definido no .env → usa ele (produção)
 * 2. Se estiver no GitHub Codespaces (*.app.github.dev) → troca a porta
 *    do hostname atual para a porta do backend (3000) automaticamente
 * 3. Caso contrário (localhost dev) → usa http://localhost:3000
 */
function resolveBaseURL() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  const { hostname, protocol } = window.location

  // GitHub Codespaces: hostname = solid-space-...-PORTA.app.github.dev
  // Troca qualquer porta pelo número da porta do backend (3000)
  if (hostname.endsWith('.app.github.dev')) {
    const backendHost = hostname.replace(/-\d+\.app\.github\.dev$/, '-3000.app.github.dev')
    return `${protocol}//${backendHost}`
  }

  return 'http://localhost:3000'
}

const api = axios.create({
  baseURL: resolveBaseURL(),
})

// Injeta o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Redireciona para /login em 401 (fora das rotas de auth)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/')
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
