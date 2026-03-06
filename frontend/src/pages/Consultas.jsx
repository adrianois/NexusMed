import { useEffect, useState } from 'react'
import api from '../api'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'

export default function Consultas() {
  const [consultas, setConsultas] = useState([])

  useEffect(() => {
    const fetchConsultas = async () => {
      const res = await api.get('/consultas')
      setConsultas(res.data.consultas)
    }
    fetchConsultas()
  }, [])

  return (
    <div>
      <Header />
      <Sidebar />
      <div className="dashboard-container" style={{ marginLeft: '240px' }}>
        <h2>Consultas</h2>
        <ul className="dashboard-list">
          {consultas.map(c => (
            <li key={c.id}>
              <strong>Paciente ID: {c.paciente_id}</strong>
              <span>Data: {c.data_consulta}</span>
              <span>Motivo: {c.motivo}</span>
              <span>Observações: {c.observacoes}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
