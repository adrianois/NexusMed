import { useEffect, useState } from "react"
import api from "../api"
import PageLayout from "../components/PageLayout"
import "./InnerPage.css"

export default function Pacientes() {
<<<<<<< HEAD
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

=======
  const [pacientes, setPacientes]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [form, setForm] = useState({
    nome: "", cpf: "", data_nascimento: "", telefone: "", email: ""
  })

>>>>>>> abea6cc837fce81785d1a5f8ad2cd4162140456d
  const carregarPacientes = () => {
    setLoading(true)
    api.get("/pacientes")
      .then(res => setPacientes(res.data || []))
      .catch(() => setErro("Erro ao carregar pacientes."))
      .finally(() => setLoading(false))
  }

<<<<<<< HEAD
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
=======
  useEffect(() => { carregarPacientes() }, [])

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome || !form.cpf) return alert("Nome e CPF são obrigatórios!")
    setSalvando(true)
    try {
      await api.post("/pacientes", form)
      setForm({ nome: "", cpf: "", data_nascimento: "", telefone: "", email: "" })
      setMostrarForm(false)
      carregarPacientes()
    } catch (err) {
      alert("Erro ao cadastrar: " + (err.response?.data?.error || err.message))
    } finally {
      setSalvando(false)
>>>>>>> abea6cc837fce81785d1a5f8ad2cd4162140456d
    }
  }

  return (
    <PageLayout title="👥 Pacientes">
<<<<<<< HEAD
      {/* Botão para mostrar/esconder formulário */}
      <div style={{ marginBottom: "20px" }}>
        <button 
          className="btn-primary" 
=======

      {/* Barra de ação */}
      <div className="inner-toolbar">
        <button
          className={`btn ${mostrarForm ? "btn-secondary" : "btn-primary"}`}
>>>>>>> abea6cc837fce81785d1a5f8ad2cd4162140456d
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? "✖ Cancelar" : "+ Novo Paciente"}
        </button>
      </div>

<<<<<<< HEAD
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
=======
      {/* Formulário */}
      {mostrarForm && (
        <div className="inner-card">
          <h3 className="inner-card-title">Cadastrar Novo Paciente</h3>
          <form onSubmit={handleSubmit} className="inner-form">

            <div className="form-field">
              <label className="form-label">Nome <span className="required">*</span></label>
              <input className="form-input" type="text" name="nome"
                value={form.nome} onChange={handleChange}
                placeholder="Nome completo" required />
            </div>

            <div className="form-field">
              <label className="form-label">CPF <span className="required">*</span></label>
              <input className="form-input" type="text" name="cpf"
                value={form.cpf} onChange={handleChange}
                placeholder="000.000.000-00" required />
            </div>

            <div className="form-field">
              <label className="form-label">Data de Nascimento</label>
              <input className="form-input" type="date" name="data_nascimento"
                value={form.data_nascimento} onChange={handleChange} />
            </div>

            <div className="form-field">
              <label className="form-label">Telefone</label>
              <input className="form-input" type="tel" name="telefone"
                value={form.telefone} onChange={handleChange}
                placeholder="(00) 00000-0000" />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" name="email"
                value={form.email} onChange={handleChange}
                placeholder="exemplo@email.com" />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={salvando}>
                {salvando ? "Salvando..." : "✓ Salvar Paciente"}
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => setMostrarForm(false)}>
                Cancelar
              </button>
            </div>

>>>>>>> abea6cc837fce81785d1a5f8ad2cd4162140456d
          </form>
        </div>
      )}

<<<<<<< HEAD
      {/* Lista de pacientes */}
      {loading && <p className="page-loading">Carregando...</p>}
      {erro && <p className="page-erro">{erro}</p>}
      
      {!loading && !erro && (
        pacientes.length === 0
          ? <p className="page-vazio">Nenhum paciente cadastrado. Clique em "+ Novo Paciente" para adicionar.</p>
=======
      {/* Estados */}
      {loading && <p className="page-loading">Carregando...</p>}
      {erro    && <p className="page-erro">{erro}</p>}

      {/* Lista */}
      {!loading && !erro && (
        pacientes.length === 0
          ? (
            <div className="page-vazio-box">
              <span className="page-vazio-icon">👥</span>
              <p>Nenhum paciente cadastrado ainda.</p>
              <button className="btn btn-primary" onClick={() => setMostrarForm(true)}>
                + Cadastrar primeiro paciente
              </button>
            </div>
          )
>>>>>>> abea6cc837fce81785d1a5f8ad2cd4162140456d
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
