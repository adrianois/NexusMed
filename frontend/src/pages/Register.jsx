import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import "./Register.css"

export default function Register() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await api.post("/auth/register", { nome, email, senha })
      alert("Conta criada com sucesso!")
      navigate("/login")
    } catch (err) {
      // ✅ Trata erros vindos do backend corretamente
      const status = err.response?.status
      const msg = err.response?.data?.error || err.response?.data?.message

      if (status === 409) {
        setError("Este e-mail já está cadastrado.")
      } else if (msg) {
        setError(msg)
      } else {
        setError("Erro ao registrar. Verifique sua conexão e tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Registrar</h2>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Crie uma senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Registrando..." : "Registrar"}
          </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <p>
          Já tem conta? <button onClick={() => navigate("/login")}>Entrar</button>
        </p>
      </div>
    </div>
  )
}
