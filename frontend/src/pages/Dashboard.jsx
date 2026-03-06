import { useAuth } from "../context/AuthContext"

export default function Dashboard() {
  const { user, logout, loading } = useAuth()

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      <h1>Bem-vindo, {user?.email}</h1>
      <button onClick={logout}>Sair</button>
    </div>
  )
}
