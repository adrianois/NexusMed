import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import "./Login.css"

export default function Login() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const response = await login(email, senha)
      // supondo que o hook useAuth retorne { token }
      if (response?.token) {
        localStorage.setItem("token", response.token)
        navigate("/dashboard")
      } else {
        setError("Erro inesperado. Tente novamente.")
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Email ou senha incorretos.")
      } else {
        setError("Erro ao fazer login. Tente novamente.")
      }
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
          <button type="submit" className="primary">Entrar</button>
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
