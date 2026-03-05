import React, { useEffect, useState } from 'react'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState({
    pacientes: 0,
    consultas: 0,
    prontuarios: 0,
    clinicas: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:3000/dashboard')
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="dashboard">
      <h2>📊 Painel NexusMed</h2>
      <div className="cards">
        <div className="card pacientes">
          <h3>Pacientes</h3>
          <p>{stats.pacientes}</p>
        </div>
        <div className="card consultas">
          <h3>Consultas</h3>
          <p>{stats.consultas}</p>
        </div>
        <div className="card prontuarios">
          <h3>Prontuários</h3>
          <p>{stats.prontuarios}</p>
        </div>
        <div className="card clinicas">
          <h3>Clínicas</h3>
          <p>{stats.clinicas}</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
