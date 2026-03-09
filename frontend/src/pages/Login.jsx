import { useState } from "react"
import { useNavigate } from "react-router-dom"
// ✅ CORREÇÃO: importa do AuthContext, não do hook isolado
import { useAuth } from "../context/AuthContext"
import "./Login.css"

export default function Login() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  // ✅ CORREÇÃO: login vem do AuthContext que já faz navigate internamente
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, senha)
      // navigate já é chamado dentro do AuthContext.login
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Email ou senha incorretos.")
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Erro ao fazer login. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <p>
          Não tem conta?{" "}
          <button onClick={() => navigate("/register")}>Registrar</button>
        </p>
      </div>
    </div>
  )
}
