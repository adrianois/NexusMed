import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

export default function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
      .then(res => {
        setUser(res.data)
      })
      .catch(() => {
        localStorage.removeItem("token")
        navigate("/login")
      })
      .finally(() => setLoading(false))
  }, [navigate])

  // Função de login
  const login = async (email, senha) => {
    const res = await api.post("/auth/login", { email, senha })
    localStorage.setItem("token", res.data.token)
    setUser({ email })
    navigate("/dashboard")
  }

  // Função de logout
  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    navigate("/login")
  }

  return { user, loading, login, logout }
}
