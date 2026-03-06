import { useEffect, useState } from 'react'
import api from '../api'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'

export default function Clinicas() {
  const [clinicas, setClinicas] = useState([])

  useEffect(() => {
    const fetchClinicas = async () => {
      const res = await api.get('/clinicas')
      setClinicas(res.data.clinicas)
    }
    fetchClinicas()
  }, [])

  return (
    <div>
      <Header />
      <Sidebar />
      <div className="dashboard-container" style={{ marginLeft: '240px' }}>
        <h2>Clínicas</h2>
        <ul className="dashboard-list">
          {clinicas.map(c => (
            <li key={c.id}>
              <strong>{c.nome}</strong>
              <span>Endereço: {c.endereco}</span>
              <span>Telefone: {c.telefone}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
