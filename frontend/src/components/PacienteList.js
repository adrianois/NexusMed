import React, { useEffect, useState } from 'react'
import { getPacientes, postData, fetchData } from '../services/api'

function PacienteList() {
  const [pacientes, setPacientes] = useState([])
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({})

  const carregarPacientes = async () => {
    const result = await getPacientes()
    setPacientes(result.pacientes || [])
  }

  useEffect(() => {
    carregarPacientes()
  }, [])

  const excluirPaciente = async (id) => {
    if (window.confirm('Deseja realmente excluir este paciente?')) {
      await fetchData(`/pacientes/${id}`, { method: 'DELETE' })
      carregarPacientes()
    }
  }

  const iniciarEdicao = (paciente) => {
    setEditando(paciente.id)
    setForm(paciente)
  }

  const salvarEdicao = async () => {
    await postData(`/pacientes/${editando}`, form, 'PUT')
    setEditando(null)
    carregarPacientes()
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div>
      <h2>Lista de Pacientes</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Data Nascimento</th>
            <th>Telefone</th>
            <th>Email</th>
            <th>Endereço</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map(p => (
            <tr key={p.id}>
              <td>
                {editando === p.id ? (
                  <input name="nome" value={form.nome} onChange={handleChange}/>
                ) : (
                  p.nome
                )}
              </td>
              <td>{p.cpf}</td>
              <td>{p.data_nascimento}</td>
              <td>
                {editando === p.id ? (
                  <input name="telefone" value={form.telefone} onChange={handleChange}/>
                ) : (
                  p.telefone
                )}
              </td>
              <td>
                {editando === p.id ? (
                  <input name="email" value={form.email} onChange={handleChange}/>
                ) : (
                  p.email
                )}
              </td>
              <td>
                {editando === p.id ? (
                  <input name="endereco" value={form.endereco} onChange={handleChange}/>
                ) : (
                  p.endereco
                )}
              </td>
              <td>
                {editando === p.id ? (
                  <>
                    <button onClick={salvarEdicao}>Salvar</button>
                    <button onClick={() => setEditando(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => iniciarEdicao(p)}>Editar</button>
                    <button onClick={() => excluirPaciente(p.id)}>Excluir</button>
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

export default PacienteList
