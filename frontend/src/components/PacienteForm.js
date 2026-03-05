import React, { useState, useEffect } from 'react'

const API_URL = process.env.REACT_APP_API_URL

function PacienteForm() {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    telefone: '',
    email: ''
  })
  const [pacientes, setPacientes] = useState([])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('✅ Paciente cadastrado com sucesso!')
        setFormData({
          nome: '',
          cpf: '',
          data_nascimento: '',
          telefone: '',
          email: ''
        })
        fetchPacientes() // atualiza lista
      } else {
        const errorData = await response.json()
        alert('❌ Erro ao cadastrar paciente: ' + errorData.message)
      }
    } catch (error) {
      alert('❌ Erro de conexão com a API: ' + error.message)
    }
  }

  const fetchPacientes = async () => {
    try {
      const res = await fetch(`${API_URL}/pacientes`)
      const data = await res.json()
      setPacientes(data)
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
    }
  }

  useEffect(() => {
    fetchPacientes()
  }, [])

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>Cadastrar Paciente</h2>
        <input
          type="text"
          name="nome"
          placeholder="Nome"
          value={formData.nome}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="cpf"
          placeholder="CPF"
          value={formData.cpf}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="data_nascimento"
          value={formData.data_nascimento}
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
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <button type="submit">Gravar</button>
      </form>

      <h3>📋 Lista de Pacientes</h3>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Data Nasc.</th>
            <th>Telefone</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((p) => (
            <tr key={p.id}>
              <td>{p.nome}</td>
              <td>{p.cpf}</td>
              <td>{p.data_nascimento}</td>
              <td>{p.telefone}</td>
              <td>{p.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PacienteForm
