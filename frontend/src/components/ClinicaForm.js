import React, { useState, useEffect } from 'react'

const API_URL = process.env.REACT_APP_API_URL

function ClinicaForm() {
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    telefone: ''
  })
  const [clinicas, setClinicas] = useState([])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/clinicas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('✅ Clínica cadastrada com sucesso!')
        setFormData({ nome: '', endereco: '', telefone: '' })
        fetchClinicas() // atualiza lista
      } else {
        const errorData = await response.json()
        alert('❌ Erro ao cadastrar clínica: ' + errorData.message)
      }
    } catch (error) {
      alert('❌ Erro de conexão com a API: ' + error.message)
    }
  }

  const fetchClinicas = async () => {
    try {
      const res = await fetch(`${API_URL}/clinicas`)
      const data = await res.json()
      setClinicas(data)
    } catch (error) {
      console.error('Erro ao carregar clínicas:', error)
    }
  }

  useEffect(() => {
    fetchClinicas()
  }, [])

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>Cadastrar Clínica</h2>
        <input
          type="text"
          name="nome"
          placeholder="Nome da clínica"
          value={formData.nome}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="endereco"
          placeholder="Endereço"
          value={formData.endereco}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="telefone"
          placeholder="Telefone"
          value={formData.telefone}
          onChange={handleChange}
        />
        <button type="submit">Gravar</button>
      </form>

      <h3>📋 Lista de Clínicas</h3>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Endereço</th>
            <th>Telefone</th>
          </tr>
        </thead>
        <tbody>
          {clinicas.map((c) => (
            <tr key={c.id}>
              <td>{c.nome}</td>
              <td>{c.endereco}</td>
              <td>{c.telefone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ClinicaForm
