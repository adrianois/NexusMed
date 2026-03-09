import { useEffect, useState } from "react"
import api from "../api"
import PageLayout from "../components/PageLayout"
import "./InnerPage.css"

export default function Prontuarios() {
  const [prontuarios, setProntuarios] = useState([])
  const [pacientes, setPacientes]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [form, setForm] = useState({
    paciente_id: "", descricao: "", data_registro: ""
  })

  const carregarDados = () => {
    setLoading(true)
    Promise.all([
      api.get("/prontuarios"),
      api.get("/pacientes")
    ])
      .then(([resProntuarios, resPacientes]) => {
        setProntuarios(resProntuarios.data || [])
        setPacientes(resPacientes.data || [])
      })
      .catch(() => setErro("Erro ao carregar dados."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregarDados() }, [])

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.paciente_id || !form.descricao || !form.data_registro) {
      return alert("Paciente, descrição e data são obrigatórios!")
    }
    setSalvando(true)
    try {
      await api.post("/prontuarios", form)
      setForm({ paciente_id: "", descricao: "", data_registro: "" })
      setMostrarForm(false)
      carregarDados()
    } catch (err) {
      alert("Erro ao cadastrar: " + (err.response?.data?.error || err.message))
    } finally {
      setSalvando(false)
    }
  }

  const getNomePaciente = (paciente_id) => {
    const p = pacientes.find(pac => pac.id === paciente_id)
    return p ? p.nome : paciente_id
  }

  return (
    <PageLayout title="📋 Prontuários">

      <div className="inner-toolbar">
        <button
          className={`btn ${mostrarForm ? "btn-secondary" : "btn-primary"}`}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? "✖ Cancelar" : "+ Novo Prontuário"}
        </button>
      </div>

      {mostrarForm && (
        <div className="inner-card">
          <h3 className="inner-card-title">Cadastrar Novo Prontuário</h3>
          <form onSubmit={handleSubmit} className="inner-form">

            <div className="form-field">
              <label className="form-label">Paciente <span className="required">*</span></label>
              <select className="form-select" name="paciente_id"
                value={form.paciente_id} onChange={handleChange} required>
                <option value="">Selecione um paciente</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Data do Registro <span className="required">*</span></label>
              <input className="form-input" type="date" name="data_registro"
                value={form.data_registro} onChange={handleChange} required />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">Descrição <span className="required">*</span></label>
              <textarea className="form-textarea" name="descricao" rows="6"
                value={form.descricao} onChange={handleChange}
                placeholder="Histórico médico, diagnósticos, tratamentos realizados..."
                required />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={salvando}>
                {salvando ? "Salvando..." : "✓ Salvar Prontuário"}
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => setMostrarForm(false)}>
                Cancelar
              </button>
            </div>

          </form>
        </div>
      )}

      {loading && <p className="page-loading">Carregando...</p>}
      {erro    && <p className="page-erro">{erro}</p>}

      {!loading && !erro && (
        prontuarios.length === 0
          ? (
            <div className="page-vazio-box">
              <span className="page-vazio-icon">📋</span>
              <p>Nenhum prontuário cadastrado ainda.</p>
              <button className="btn btn-primary" onClick={() => setMostrarForm(true)}>
                + Cadastrar primeiro prontuário
              </button>
            </div>
          )
          : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Descrição</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {prontuarios.map(p => (
                    <tr key={p.id}>
                      <td>{getNomePaciente(p.paciente_id)}</td>
                      <td>{p.descricao}</td>
                      <td>{p.data_registro}</td>
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
