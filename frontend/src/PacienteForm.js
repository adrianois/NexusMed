import React, { useState } from 'react'

function PacienteForm({ onPacienteCadastrado }) {
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    endereco: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const response = await fetch('/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await response.json()
    alert('Paciente cadastrado com sucesso!')
    onPacienteCadastrado() // atualiza a lista
    setForm({ nome: '', cpf: '', data_nascimento: '', telefone: '', email: '', endereco: '' })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Cadastro de Paciente</h2>
      <input name="nome" placeholder="Nome" value={form.nome} onChange={handleChange} required />
      <input name="cpf" placeholder="CPF" value={form.cpf} onChange={handleChange} required />
      <input type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} required />
      <input name="telefone" placeholder="Telefone" value={form.telefone} onChange={handleChange} />
      <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
      <input name="endereco" placeholder="Endereço" value={form.endereco} onChange={handleChange} />
      <button type="submit">Cadastrar</button>
    </form>
  )
}

export default PacienteForm
