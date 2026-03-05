import React, { useState } from 'react'

function ConsultaForm({ onConsultaCadastrada }) {
  const [form, setForm] = useState({
    paciente_id: '',
    medico_id: '',
    data_consulta: '',
    motivo: '',
    observacoes: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const response = await fetch('/consultas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await response.json()
    alert('Consulta cadastrada com sucesso!')
    onConsultaCadastrada()
    setForm({ paciente_id: '', medico_id: '', data_consulta: '', motivo: '', observacoes: '' })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Cadastro de Consulta</h2>
      <input name="paciente_id" placeholder="ID do Paciente" value={form.paciente_id} onChange={handleChange} required />
      <input name="medico_id" placeholder="ID do Médico" value={form.medico_id} onChange={handleChange} />
      <input type="datetime-local" name="data_consulta" value={form.data_consulta} onChange={handleChange} required />
      <input name="motivo" placeholder="Motivo" value={form.motivo} onChange={handleChange} />
      <textarea name="observacoes" placeholder="Observações" value={form.observacoes} onChange={handleChange}></textarea>
      <button type="submit">Cadastrar</button>
    </form>
  )
}

export default ConsultaForm
