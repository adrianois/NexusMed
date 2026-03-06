import { useState } from 'react'
import api from '../api'

export default function FormProntuario({ onCreated }) {
  const [pacienteId, setPacienteId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataRegistro, setDataRegistro] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post('/prontuarios', {
      paciente_id: pacienteId,
      descricao,
      data_registro: dataRegistro
    })
    onCreated()
    setPacienteId('')
    setDescricao('')
    setDataRegistro('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Paciente ID"
        value={pacienteId}
        onChange={e => setPacienteId(e.target.value)}
        required
      />
      <textarea
        placeholder="Descrição do prontuário"
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
        required
      />
      <input
        type="date"
        value={dataRegistro}
        onChange={e => setDataRegistro(e.target.value)}
        required
      />
      <button type="submit" className="success">Adicionar Prontuário</button>
    </form>
  )
}
