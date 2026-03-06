import { useState } from 'react'
import api from '../api'

export default function FormConsulta({ onCreated }) {
  const [pacienteId, setPacienteId] = useState('')
  const [dataConsulta, setDataConsulta] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post('/consultas', {
      paciente_id: pacienteId,
      data_consulta: dataConsulta,
      motivo,
      observacoes
    })
    onCreated()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Paciente ID" value={pacienteId} onChange={e => setPacienteId(e.target.value)} required />
      <input type="date" value={dataConsulta} onChange={e => setDataConsulta(e.target.value)} required />
      <input placeholder="Motivo" value={motivo} onChange={e => setMotivo(e.target.value)} />
      <textarea placeholder="Observações" value={observacoes} onChange={e => setObservacoes(e.target.value)} />
      <button type="submit" className="success">Adicionar Consulta</button>
    </form>
  )
}
