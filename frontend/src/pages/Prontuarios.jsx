import { useEffect, useState } from 'react'
import api from '../api'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'

export default function Prontuarios() {
  const [prontuarios, setProntuarios] = useState([])

  useEffect(() => {
    const fetchProntuarios = async () => {
      const res = await api.get('/prontuarios')
      setProntuarios(res.data.prontuarios)
    }
    fetchProntuarios()
  }, [])

  return (
    <div>
      <Header />
      <Sidebar />
      <div className="dashboard-container" style={{ marginLeft: '240px' }}>
        <h2>Prontuários</h2>
        <ul className="dashboard-list">
          {prontuarios.map(p => (
            <li key={p.id}>
              <strong>Paciente ID: {p.paciente_id}</strong>
              <span>Data: {p.data_registro}</span>
              <span>Descrição: {p.descricao}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
