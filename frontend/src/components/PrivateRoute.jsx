import { Navigate } from "react-router-dom"
// ✅ CORREÇÃO: importa do AuthContext que tem 'loading' e 'user' corretos
import { useAuth } from "../context/AuthContext"

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p>Carregando...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
