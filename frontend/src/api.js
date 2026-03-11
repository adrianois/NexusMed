import axios from 'axios'

/**
 * Resolve a baseURL da API em qualquer ambiente:
 *
 * 1. Se VITE_API_URL estiver definido no .env -> usa ele (producao)
 * 2. GitHub Codespaces (*.app.github.dev) -> troca porta para VITE_BACKEND_PORT ou 4000
 * 3. Localhost -> http://localhost:4000
 */
function resolveBaseURL() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  const { hostname, protocol } = window.location
  const backendPort = import.meta.env.VITE_BACKEND_PORT || '4000'

  if (hostname.endsWith('.app.github.dev')) {
    const backendHost = hostname.replace(/-\d+\.app\.github\.dev$/, `-${backendPort}.app.github.dev`)
    return `${protocol}//${backendHost}`
  }

  return `http://localhost:${backendPort}`
}

const api = axios.create({
  baseURL: resolveBaseURL(),
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

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
