import { useState } from 'react'
import api from '../api'

export default function FormPaciente({ onCreated }) {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post('/pacientes', {
      nome,
      cpf,
      data_nascimento: dataNascimento,
      telefone,
      email,
      endereco
    })
    onCreated()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} required />
      <input placeholder="CPF" value={cpf} onChange={e => setCpf(e.target.value)} required />
      <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} required />
      <input placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Endereço" value={endereco} onChange={e => setEndereco(e.target.value)} />
      <button type="submit" className="success">Adicionar Paciente</button>
    </form>
  )
}
