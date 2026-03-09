import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, perfis }) {
  const { user, loading } = useAuth()
  if (loading) return <p style={{padding:'2rem'}}>Carregando...</p>
  if (!user) return <Navigate to='/login' replace />
  if (perfis && !perfis.includes(user.perfil)) return <Navigate to='/nao-autorizado' replace />
  return children
}
