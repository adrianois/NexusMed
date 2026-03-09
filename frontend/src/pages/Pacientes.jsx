import { useEffect, useState } from "react"
import api from "../api"
import PageLayout from "../components/PageLayout"
import "./InnerPage.css"

export default function Pacientes() {
  const [pacientes, setPacientes]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [form, setForm] = useState({
    nome: "", cpf: "", data_nascimento: "", telefone: "", email: ""
  })

  const carregarPacientes = () => {
    setLoading(true)
    api.get("/pacientes")
      .then(res => setPacientes(res.data || []))
      .catch(() => setErro("Erro ao carregar pacientes."))
      .finally(() => setLoading(false))
  }

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
    }
  }

  return (
    <PageLayout title="👥 Pacientes">

      {/* Barra de ação */}
      <div className="inner-toolbar">
        <button
          className={`btn ${mostrarForm ? "btn-secondary" : "btn-primary"}`}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? "✖ Cancelar" : "+ Novo Paciente"}
        </button>
      </div>

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

          </form>
        </div>
      )}

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
