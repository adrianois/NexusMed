import { useEffect, useState } from "react"
import api from "../api"
import PageLayout from "../components/PageLayout"
import "./InnerPage.css"

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [erro, setErro]           = useState(null)

  useEffect(() => {
    api.get("/pacientes")
      .then(res => setPacientes(res.data.pacientes || []))
      .catch(() => setErro("Erro ao carregar pacientes."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageLayout title="👥 Pacientes">
      {loading && <p className="page-loading">Carregando...</p>}
      {erro    && <p className="page-erro">{erro}</p>}
      {!loading && !erro && (
        pacientes.length === 0
          ? <p className="page-vazio">Nenhum paciente cadastrado.</p>
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
