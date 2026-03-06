import { Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p>Carregando...</p>
  }

  // Se não tiver usuário logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se tiver usuário, renderiza o conteúdo protegido
  return children
}
