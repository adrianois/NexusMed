import { useEffect, useState } from "react"
import api from "../api"
import PageLayout from "../components/PageLayout"
import "./InnerPage.css"

export default function Prontuarios() {
  const [prontuarios, setProntuarios] = useState([])
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)

  useEffect(() => {
    api.get("/prontuarios")
      .then(res => setProntuarios(res.data.prontuarios || []))
      .catch(() => setErro("Erro ao carregar prontuários."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageLayout title="📋 Prontuários">
      {loading && <p className="page-loading">Carregando...</p>}
      {erro    && <p className="page-erro">{erro}</p>}
      {!loading && !erro && (
        prontuarios.length === 0
          ? <p className="page-vazio">Nenhum prontuário cadastrado.</p>
          : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Paciente ID</th>
                    <th>Descrição</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {prontuarios.map(p => (
                    <tr key={p.id}>
                      <td>{p.paciente_id}</td>
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
