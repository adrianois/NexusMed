import React from 'react'
import ProntuarioForm from '../components/ProntuarioForm'
import ProntuarioList from '../components/ProntuarioList'

function ProntuariosPage() {
  return (
    <div>
      <h1>Prontuários</h1>
      <ProntuarioForm onProntuarioCadastrado={() => {}} />
      <ProntuarioList />
    </div>
  )
}

export default ProntuariosPage
