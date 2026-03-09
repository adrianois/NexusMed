import { useEffect, useState } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'

export default function GestorUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = () => {
    setLoading(true)
    api.get('/gestor/usuarios/pendentes').then(r => setUsuarios(r.data || [])).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const aprovar = async (id, aprovado) => {
    try {
      await api.patch(`/gestor/usuarios/${id}/aprovar`, { aprovado })
      carregar()
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <PageLayout title='👥 Aprovar Usuários'>
      {loading && <p className='page-loading'>Carregando...</p>}
      {!loading && usuarios.length === 0 && (
        <div className='page-vazio-box'>
          <span className='page-vazio-icon'>✅</span>
          <p>Nenhum usuário pendente de aprovação!</p>
        </div>
      )}
      {!loading && usuarios.length > 0 && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead><tr><th>Nome</th><th>Email</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight:600}}>{u.nome}</td>
                  <td style={{color:'#94a3b8'}}>{u.email}</td>
                  <td><span className='badge badge-pendente'>Pendente</span></td>
                  <td style={{display:'flex', gap:'8px'}}>
                    <button className='btn btn-success' style={{fontSize:'0.78rem',padding:'5px 12px'}} onClick={() => aprovar(u.id, true)}>✓ Aprovar</button>
                    <button className='btn btn-danger'  style={{fontSize:'0.78rem',padding:'5px 12px'}} onClick={() => aprovar(u.id, false)}>✗ Recusar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}
