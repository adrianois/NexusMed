import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'

import PacienteForm from './components/PacienteForm'
import ConsultaForm from './components/ConsultaForm'
import ProntuarioForm from './components/ProntuarioForm'
import ClinicaForm from './components/ClinicaForm'
import Dashboard from './components/Dashboard'

function App() {
  const [darkMode, setDarkMode] = useState(false)

  const toggleTheme = () => {
    setDarkMode(!darkMode)
  }

  return (
    <Router>
      <div className={`App ${darkMode ? 'dark' : 'light'}`}>
        <header>
          <h1>NexusMed</h1>
          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme}>
              {darkMode ? '🌙 Escuro' : '☀️ Claro'}
            </button>
          </div>
        </header>

        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/pacientes">Pacientes</Link>
          <Link to="/consultas">Consultas</Link>
          <Link to="/prontuarios">Prontuários</Link>
          <Link to="/clinicas">Clínicas</Link>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pacientes" element={<PacienteForm />} />
            <Route path="/consultas" element={<ConsultaForm />} />
            <Route path="/prontuarios" element={<ProntuarioForm />} />
            <Route path="/clinicas" element={<ClinicaForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
