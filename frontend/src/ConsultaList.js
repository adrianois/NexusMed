import React, { useEffect, useState } from 'react'

function ConsultaList() {
  const [consultas, setConsultas] = useState([])
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({})

  const carregarConsultas = async () => {
    const response = await fetch('/consultas')
    const data = await response.json()
    setConsultas(data)
  }

  useEffect(() => {
    carregarConsultas()
  }, [])

  const excluirConsulta = async (id) => {
    if (window.confirm('Deseja realmente excluir esta consulta?')) {
      await fetch(`/consultas/${id}`, { method: 'DELETE' })
      carregarConsultas()
    }
  }

  const iniciarEdicao = (consulta) => {
    setEditando(consulta.id)
    setForm(consulta)
  }

  const salvarEdicao = async () => {
    await fetch(`http://localhost:3000/consultas/${editando}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setEditando(null)
    carregarConsultas()
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div>
      <h2>Lista de Consultas</h2>
      <table>
        <thead>
          <tr>
            <th>Paciente ID</th>
            <th>Médico ID</th>
            <th>Data</th>
            <th>Motivo</th>
            <th>Observações</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {consultas.map(c => (
            <tr key={c.id}>
              <td>{c.paciente_id}</td>
              <td>{c.medico_id}</td>
              <td>{c.data_consulta}</td>
              <td>{editando === c.id ? <input name="motivo" value={form.motivo} onChange={handleChange}/> : c.motivo}</td>
              <td>{editando === c.id ? <input name="observacoes" value={form.observacoes} onChange={handleChange}/> : c.observacoes}</td>
              <td>
                {editando === c.id ? (
                  <>
                    <button onClick={salvarEdicao}>Salvar</button>
                    <button onClick={() => setEditando(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => iniciarEdicao(c)}>Editar</button>
                    <button onClick={() => excluirConsulta(c.id)}>Excluir</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ConsultaList
