import React, { useState, useEffect } from 'react'

const API_URL = process.env.REACT_APP_API_URL

function ProntuarioForm() {
  const [formData, setFormData] = useState({
    paciente_id: '',
    descricao: ''
  })
  const [prontuarios, setProntuarios] = useState([])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/prontuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('✅ Prontuário cadastrado com sucesso!')
        setFormData({ paciente_id: '', descricao: '' })
        fetchProntuarios() // atualiza lista
      } else {
        const errorData = await response.json()
        alert('❌ Erro ao cadastrar prontuário: ' + errorData.message)
      }
    } catch (error) {
      alert('❌ Erro de conexão com a API: ' + error.message)
    }
  }

  const fetchProntuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/prontuarios`)
      const data = await res.json()
      setProntuarios(data)
    } catch (error) {
      console.error('Erro ao carregar prontuários:', error)
    }
  }

  useEffect(() => {
    fetchProntuarios()
  }, [])

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>Cadastrar Prontuário</h2>
        <input
          type="text"
          name="paciente_id"
          placeholder="ID do Paciente"
          value={formData.paciente_id}
          onChange={handleChange}
          required
        />
        <textarea
          name="descricao"
          placeholder="Descrição do prontuário"
          value={formData.descricao}
          onChange={handleChange}
          required
        />
        <button type="submit">Gravar</button>
      </form>

      <h3>📋 Lista de Prontuários</h3>
      <table>
        <thead>
          <tr>
            <th>ID Paciente</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          {prontuarios.map((p) => (
            <tr key={p.id}>
              <td>{p.paciente_id}</td>
              <td>{p.descricao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProntuarioForm
