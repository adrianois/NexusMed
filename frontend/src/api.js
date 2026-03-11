import axios from 'axios'

// Em desenvolvimento com Vite, usamos o proxy (/api -> backend:4000).
// Em produção ou Codespaces, definir VITE_API_URL no .env do frontend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
