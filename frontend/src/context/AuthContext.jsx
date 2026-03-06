import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Função para renovar token
  const refreshToken = async () => {
    const refresh = localStorage.getItem("refreshToken")
    if (!refresh) return logout()

    try {
      const res = await api.post("/auth/refresh", { refreshToken: refresh })
      localStorage.setItem("token", res.data.token)
      return res.data.token
    } catch {
      logout()
    }
  }

  // Verifica token ao carregar
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setLoading(false)
      return
    }

    api.get("/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setUser(res.data))
      .catch(async () => {
        const newToken = await refreshToken()
        if (newToken) {
          api.get("/dashboard", {
            headers: { Authorization: `Bearer ${newToken}` }
          }).then(res => setUser(res.data))
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const login = async (email, senha) => {
    const res = await api.post("/auth/login", { email, senha })
    localStorage.setItem("token", res.data.token)
    localStorage.setItem("refreshToken", res.data.refreshToken)
    setUser({ email })
    navigate("/dashboard")
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    setUser(null)
    navigate("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
