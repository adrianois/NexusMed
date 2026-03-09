import { useEffect, useState } from "react"
import api from "../api"
import PageLayout from "../components/PageLayout"
import "./InnerPage.css"

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [erro, setErro]           = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  
  // Estado do formulário
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    data_nascimento: "",
    telefone: "",
    email: ""
  })

  // Buscar pacientes
  useEffect(() => {
    carregarPacientes()
  }, [])

  const carregarPacientes = () => {
    setLoading(true)
    api.get("/pacientes")
      .then(res => setPacientes(res.data || []))
      .catch(() => setErro("Erro ao carregar pacientes."))
      .finally(() => setLoading(false))
  }

  // Atualizar campos do formulário
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Salvar novo paciente
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.nome || !form.cpf) {
      alert("Nome e CPF são obrigatórios!")
      return
    }

    try {
      await api.post("/pacientes", form)
      alert("Paciente cadastrado com sucesso!")
      
      // Limpar formulário
      setForm({
        nome: "",
        cpf: "",
        data_nascimento: "",
        telefone: "",
        email: ""
      })
      
      // Esconder formulário e recarregar lista
      setMostrarForm(false)
      carregarPacientes()
    } catch (err) {
      alert("Erro ao cadastrar paciente: " + (err.response?.data?.error || err.message))
    }
  }

  return (
    <PageLayout title="👥 Pacientes">
      {/* Botão para mostrar/esconder formulário */}
      <div style={{ marginBottom: "20px" }}>
        <button 
          className="btn-primary" 
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? "✖ Cancelar" : "+ Novo Paciente"}
        </button>
      </div>

      {/* Formulário de cadastro */}
      {mostrarForm && (
        <div className="form-container">
          <h3>Cadastrar Novo Paciente</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-field">
              <label>Nome *</label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>CPF *</label>
              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div className="form-field">
              <label>Data de Nascimento</label>
              <input
                type="date"
                name="data_nascimento"
                value={form.data_nascimento}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Telefone</label>
              <input
                type="tel"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="exemplo@email.com"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-success">
                ✓ Salvar Paciente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de pacientes */}
      {loading && <p className="page-loading">Carregando...</p>}
      {erro && <p className="page-erro">{erro}</p>}
      
      {!loading && !erro && (
        pacientes.length === 0
          ? <p className="page-vazio">Nenhum paciente cadastrado. Clique em "+ Novo Paciente" para adicionar.</p>
          : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Nascimento</th>
                    <th>Telefone</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map(p => (
                    <tr key={p.id}>
                      <td>{p.nome}</td>
                      <td>{p.cpf}</td>
                      <td>{p.data_nascimento}</td>
                      <td>{p.telefone}</td>
                      <td>{p.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}
    </PageLayout>
  )
}
