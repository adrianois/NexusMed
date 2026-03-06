import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import "./Register.css"

export default function Register() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await api.post("/auth/register", { nome, email, senha })
      alert("Conta criada com sucesso!")
      navigate("/login")
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError("Este email já está cadastrado.")
      } else {
        setError("Erro ao registrar. Tente novamente.")
      }
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
          <button type="submit" className="primary">Registrar</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <p>
          Já tem conta? <button onClick={() => navigate("/login")}>Entrar</button>
        </p>
      </div>
    </div>
  )
}
