import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Menu from './Menu'
import PacienteForm from './PacienteForm'
import PacienteList from './PacienteList'
import ConsultaForm from './ConsultaForm'
import ConsultaList from './ConsultaList'
import ProntuarioForm from './ProntuarioForm'
import ProntuarioList from './ProntuarioList'
import './App.css'

function App() {
  return (
    <Router>
      <Menu />
      <div className="conteudo">
        <Routes>
          <Route path="/pacientes" element={
            <>
              <PacienteForm onPacienteCadastrado={() => {}} />
              <PacienteList />
            </>
          } />
          <Route path="/consultas" element={
            <>
              <ConsultaForm onConsultaCadastrada={() => {}} />
              <ConsultaList />
            </>
          } />
          <Route path="/prontuarios" element={
            <>
              <ProntuarioForm onProntuarioCadastrado={() => {}} />
              <ProntuarioList />
            </>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
