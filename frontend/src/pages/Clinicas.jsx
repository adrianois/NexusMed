import { useEffect, useState } from "react"
import api from "../api"
import PageLayout from "../components/PageLayout"
import "./InnerPage.css"

export default function Clinicas() {
  const [clinicas, setClinicas] = useState([])
  const [loading, setLoading]   = useState(true)
  const [erro, setErro]         = useState(null)

  useEffect(() => {
    api.get("/clinicas")
      .then(res => setClinicas(res.data.clinicas || []))
      .catch(() => setErro("Erro ao carregar clínicas."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageLayout title="🏨 Clínicas">
      {loading && <p className="page-loading">Carregando...</p>}
      {erro    && <p className="page-erro">{erro}</p>}
      {!loading && !erro && (
        clinicas.length === 0
          ? <p className="page-vazio">Nenhuma clínica cadastrada.</p>
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
                      <td>{c.endereco}</td>
                      <td>{c.telefone}</td>
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
