import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const AuthContext = createContext(null)

function decodeToken(token) {
  try {
    const base64 = token.split('.')[1]
    const decoded = JSON.parse(atob(base64))
    return decoded
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = decodeToken(token)
      if (decoded) setUser(decoded)
      else localStorage.removeItem('token')
    }
    setLoading(false)
  }, [])

  const login = async (email, senha) => {
    const res = await api.post('/auth/login', { email, senha })
    const { token, perfil } = res.data
    localStorage.setItem('token', token)
    const decoded = decodeToken(token)
    setUser(decoded)

    // Redireciona cada perfil para seu módulo correto
    if      (perfil === 'admin')  navigate('/admin')
    else if (perfil === 'gestor') navigate('/gestor')
    else if (perfil === 'medico') navigate('/medico')   // ← CORRIGIDO
    else                          navigate('/dashboard') // normal
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
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
