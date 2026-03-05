import React, { useState } from 'react'

function ProntuarioForm({ onProntuarioCadastrado }) {
  const [form, setForm] = useState({
    paciente_id: '',
    consulta_id: '',
    descricao: '',
    exames: '',
    prescricoes: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const response = await fetch('/prontuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await response.json()
    alert('Prontuário cadastrado com sucesso!')
    onProntuarioCadastrado()
    setForm({ paciente_id: '', consulta_id: '', descricao: '', exames: '', prescricoes: '' })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Cadastro de Prontuário</h2>
      <input name="paciente_id" placeholder="ID do Paciente" value={form.paciente_id} onChange={handleChange} required />
      <input name="consulta_id" placeholder="ID da Consulta" value={form.consulta_id} onChange={handleChange} />
      <textarea name="descricao" placeholder="Descrição clínica" value={form.descricao} onChange={handleChange}></textarea>
      <textarea name="exames" placeholder="Exames (JSON)" value={form.exames} onChange={handleChange}></textarea>
      <textarea name="prescricoes" placeholder="Prescrições (JSON)" value={form.prescricoes} onChange={handleChange}></textarea>
      <button type="submit">Cadastrar</button>
    </form>
  )
}

export default ProntuarioForm
