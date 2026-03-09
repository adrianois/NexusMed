import { useEffect, useState } from "react"
import api from "../api"
import PageLayout from "../components/PageLayout"
import "./InnerPage.css"

export default function Clinicas() {
  const [clinicas, setClinicas]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [form, setForm] = useState({
    nome: "", endereco: "", telefone: ""
  })

  const carregarClinicas = () => {
    setLoading(true)
    api.get("/clinicas")
      .then(res => setClinicas(res.data || []))
      .catch(() => setErro("Erro ao carregar clínicas."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregarClinicas() }, [])

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome) return alert("Nome da clínica é obrigatório!")
    setSalvando(true)
    try {
      await api.post("/clinicas", form)
      setForm({ nome: "", endereco: "", telefone: "" })
      setMostrarForm(false)
      carregarClinicas()
    } catch (err) {
      alert("Erro ao cadastrar: " + (err.response?.data?.error || err.message))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <PageLayout title="🏨 Clínicas">

      <div className="inner-toolbar">
        <button
          className={`btn ${mostrarForm ? "btn-secondary" : "btn-primary"}`}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? "✖ Cancelar" : "+ Nova Clínica"}
        </button>
      </div>

      {mostrarForm && (
        <div className="inner-card">
          <h3 className="inner-card-title">Cadastrar Nova Clínica</h3>
          <form onSubmit={handleSubmit} className="inner-form">

            <div className="form-field form-field--full">
              <label className="form-label">Nome da Clínica <span className="required">*</span></label>
              <input className="form-input" type="text" name="nome"
                value={form.nome} onChange={handleChange}
                placeholder="Ex: Clínica Santa Maria" required />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">Endereço</label>
              <input className="form-input" type="text" name="endereco"
                value={form.endereco} onChange={handleChange}
                placeholder="Rua, número, bairro, cidade, estado" />
            </div>

            <div className="form-field">
              <label className="form-label">Telefone</label>
              <input className="form-input" type="tel" name="telefone"
                value={form.telefone} onChange={handleChange}
                placeholder="(00) 00000-0000" />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={salvando}>
                {salvando ? "Salvando..." : "✓ Salvar Clínica"}
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
        clinicas.length === 0
          ? (
            <div className="page-vazio-box">
              <span className="page-vazio-icon">🏨</span>
              <p>Nenhuma clínica cadastrada ainda.</p>
              <button className="btn btn-primary" onClick={() => setMostrarForm(true)}>
                + Cadastrar primeira clínica
              </button>
            </div>
          )
          : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Endereço</th>
                    <th>Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicas.map(c => (
                    <tr key={c.id}>
                      <td>{c.nome}</td>
                      <td>{c.endereco || "-"}</td>
                      <td>{c.telefone || "-"}</td>
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
