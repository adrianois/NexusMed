import React from 'react'
import PacienteForm from '../components/PacienteForm'
import PacienteList from '../components/PacienteList'

function PacientesPage() {
  return (
    <div>
      <h1>Pacientes</h1>
      <PacienteForm onPacienteCadastrado={() => {}} />
      <PacienteList />
    </div>
  )
}

export default PacientesPage
