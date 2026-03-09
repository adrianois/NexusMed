import { useState } from "react"
import api from "../api" // seu axios configurado

export default function useAuth() {
  const [user, setUser] = useState(null)

  // Função de login
  const login = async (email, senha) => {
    const response = await api.post("/auth/login", { email, senha })
    const { token, usuario } = response.data

    // salva token no localStorage
    localStorage.setItem("token", token)
    setUser(usuario)

    return { token, usuario }
  }

  // Função de logout
  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  // Função de registro (opcional)
  const register = async (nome, email, senha) => {
    const response = await api.post("/auth/register", { nome, email, senha })
    return response.data
  }

  return { user, login, logout, register }
}
