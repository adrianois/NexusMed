import React, { useState, useEffect } from 'react'

const API_URL = process.env.REACT_APP_API_URL

function ConsultaForm() {
  const [formData, setFormData] = useState({
    paciente_id: '',
    data_consulta: '',
    motivo: ''
  })
  const [consultas, setConsultas] = useState([])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('✅ Consulta cadastrada com sucesso!')
        setFormData({ paciente_id: '', data_consulta: '', motivo: '' })
        fetchConsultas() // atualiza lista
      } else {
        const errorData = await response.json()
        alert('❌ Erro ao cadastrar consulta: ' + errorData.message)
      }
    } catch (error) {
      alert('❌ Erro de conexão com a API: ' + error.message)
    }
  }

  const fetchConsultas = async () => {
    try {
      const res = await fetch(`${API_URL}/consultas`)
      const data = await res.json()
      setConsultas(data)
    } catch (error) {
      console.error('Erro ao carregar consultas:', error)
    }
  }

  useEffect(() => {
    fetchConsultas()
  }, [])

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>Cadastrar Consulta</h2>
        <input
          type="text"
          name="paciente_id"
          placeholder="ID do Paciente"
          value={formData.paciente_id}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="data_consulta"
          value={formData.data_consulta}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="motivo"
          placeholder="Motivo da consulta"
          value={formData.motivo}
          onChange={handleChange}
        />
        <button type="submit">Gravar</button>
      </form>

      <h3>📋 Lista de Consultas</h3>
      <table>
        <thead>
          <tr>
            <th>ID Paciente</th>
            <th>Data</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {consultas.map((c) => (
            <tr key={c.id}>
              <td>{c.paciente_id}</td>
              <td>{c.data_consulta}</td>
              <td>{c.motivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ConsultaForm
