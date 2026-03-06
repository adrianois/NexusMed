import { useState } from 'react'
import api from '../api'

export default function FormClinica({ onCreated }) {
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [telefone, setTelefone] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post('/clinicas', { nome, endereco, telefone })
    onCreated()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Nome da clínica" value={nome} onChange={e => setNome(e.target.value)} required />
      <input placeholder="Endereço" value={endereco} onChange={e => setEndereco(e.target.value)} />
      <input placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
      <button type="submit" className="success">Adicionar Clínica</button>
    </form>
  )
}
