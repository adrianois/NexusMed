import React, { useEffect, useState } from 'react'
import { getClinicas } from '../services/api'

function ClinicaList() {
  const [clinicas, setClinicas] = useState([])

  const carregarClinicas = async () => {
    const result = await getClinicas()
    // garante que sempre seja um array
    setClinicas(result.clinicas || [])
  }

  useEffect(() => {
    carregarClinicas()
  }, [])

  return (
    <div>
      <h2>Lista de Clínicas</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CNPJ</th>
            <th>Telefone</th>
            <th>Email</th>
            <th>Endereço</th>
            <th>Cidade</th>
            <th>Estado</th>
            <th>CEP</th>
          </tr>
        </thead>
        <tbody>
          {clinicas.map(c => (
            <tr key={c.id}>
              <td>{c.nome}</td>
              <td>{c.cnpj}</td>
              <td>{c.telefone}</td>
              <td>{c.email}</td>
              <td>{c.endereco}</td>
              <td>{c.cidade}</td>
              <td>{c.estado}</td>
              <td>{c.cep}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ClinicaList
