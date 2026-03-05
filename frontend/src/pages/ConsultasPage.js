import React from 'react'
import ConsultaForm from '../components/ConsultaForm'
import ConsultaList from '../components/ConsultaList'

function ConsultasPage() {
  return (
    <div>
      <h1>Consultas</h1>
      <ConsultaForm onConsultaCadastrada={() => {}} />
      <ConsultaList />
    </div>
  )
}

export default ConsultasPage
