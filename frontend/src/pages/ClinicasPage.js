import React from 'react'
import ClinicaForm from '../components/ClinicaForm'
import ClinicaList from '../components/ClinicaList'

function ClinicasPage() {
  return (
    <div>
      <h1>Clínicas</h1>
      <ClinicaForm onClinicaCadastrada={() => {}} />
      <ClinicaList />
    </div>
  )
}

export default ClinicasPage
