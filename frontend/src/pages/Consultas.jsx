import { useEffect, useState } from "react"
import api from "../api"
import PageLayout from "../components/PageLayout"
import "./InnerPage.css"

export default function Consultas() {
  const [consultas, setConsultas]     = useState([])
  const [pacientes, setPacientes]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [form, setForm] = useState({
    paciente_id: "", data_consulta: "", motivo: "", observacoes: ""
  })

  const carregarDados = () => {
    setLoading(true)
    Promise.all([
      api.get("/consultas"),
      api.get("/pacientes")
    ])
      .then(([resConsultas, resPacientes]) => {
        setConsultas(resConsultas.data || [])
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
    if (!form.paciente_id || !form.data_consulta || !form.motivo) {
      return alert("Paciente, data e motivo são obrigatórios!")
    }
    setSalvando(true)
    try {
      await api.post("/consultas", form)
      setForm({ paciente_id: "", data_consulta: "", motivo: "", observacoes: "" })
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
    <PageLayout title="📅 Consultas">

      <div className="inner-toolbar">
        <button
          className={`btn ${mostrarForm ? "btn-secondary" : "btn-primary"}`}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? "✖ Cancelar" : "+ Nova Consulta"}
        </button>
      </div>

      {mostrarForm && (
        <div className="inner-card">
          <h3 className="inner-card-title">Agendar Nova Consulta</h3>
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
              <label className="form-label">Data da Consulta <span className="required">*</span></label>
              <input className="form-input" type="date" name="data_consulta"
                value={form.data_consulta} onChange={handleChange} required />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">Motivo <span className="required">*</span></label>
              <input className="form-input" type="text" name="motivo"
                value={form.motivo} onChange={handleChange}
                placeholder="Ex: Consulta de rotina, dor no joelho..." required />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">Observações</label>
              <textarea className="form-textarea" name="observacoes" rows="4"
                value={form.observacoes} onChange={handleChange}
                placeholder="Anotações adicionais sobre a consulta..." />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={salvando}>
                {salvando ? "Salvando..." : "✓ Salvar Consulta"}
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
        consultas.length === 0
          ? (
            <div className="page-vazio-box">
              <span className="page-vazio-icon">📅</span>
              <p>Nenhuma consulta agendada ainda.</p>
              <button className="btn btn-primary" onClick={() => setMostrarForm(true)}>
                + Agendar primeira consulta
              </button>
            </div>
          )
          : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Data</th>
                    <th>Motivo</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {consultas.map(c => (
                    <tr key={c.id}>
                      <td>{getNomePaciente(c.paciente_id)}</td>
                      <td>{c.data_consulta}</td>
                      <td>{c.motivo}</td>
                      <td>{c.observacoes || "-"}</td>
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
