import React, { useEffect, useState } from 'react'

function ProntuarioList() {
  const [prontuarios, setProntuarios] = useState([])

  const carregarProntuarios = async () => {
    const response = await fetch('/prontuarios')
    const data = await response.json()
    setProntuarios(data)
  }

  useEffect(() => {
    carregarProntuarios()
  }, [])

  const excluirProntuario = async (id) => {
    if (window.confirm('Deseja realmente excluir este prontuário?')) {
      await fetch(`/prontuarios/${id}`, { method: 'DELETE' })
      carregarProntuarios()
    }
  }

  return (
    <div>
      <h2>Lista de Prontuários</h2>
      <table>
        <thead>
          <tr>
            <th>Paciente ID</th>
            <th>Consulta ID</th>
            <th>Descrição</th>
            <th>Exames</th>
            <th>Prescrições</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {prontuarios.map(p => (
            <tr key={p.id}>
              <td>{p.paciente_id}</td>
              <td>{p.consulta_id}</td>
              <td>{p.descricao}</td>
              <td>{JSON.stringify(p.exames)}</td>
              <td>{JSON.stringify(p.prescricoes)}</td>
              <td>
                <button onClick={() => excluirProntuario(p.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProntuarioList
