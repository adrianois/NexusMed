import { useEffect, useState } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [clinicas, setClinicas] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = () => {
    setLoading(true)
    Promise.all([api.get('/admin/usuarios'), api.get('/admin/clinicas')])
      .then(([ru, rc]) => { setUsuarios(ru.data || []); setClinicas(rc.data || []) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const atualizar = async (id, campos) => {
    try {
      await api.patch(`/admin/usuarios/${id}`, campos)
      carregar()
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message))
    }
  }

  const getNomeClinica = id => clinicas.find(c => c.id === id)?.nome || '-'

  return (
    <PageLayout title='👤 Gerenciar Usuários'>
      {loading && <p className='page-loading'>Carregando...</p>}
      {!loading && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th><th>Clínica</th><th>Ações</th></tr></thead>
            <tbody>
              {usuarios.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#64748b',padding:'2rem'}}>Nenhum usuário encontrado.</td></tr>}
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight:600}}>{u.nome}</td>
                  <td style={{color:'#94a3b8'}}>{u.email}</td>
                  <td>
                    <select
                      value={u.perfil}
                      onChange={e => atualizar(u.id, { perfil: e.target.value })}
                      style={{ background:'#0f172a', border:'1px solid #334155', color:'#e2e8f0', borderRadius:'4px', padding:'4px 8px', fontSize:'0.82rem' }}
                    >
                      <option value='normal'>Normal</option>
                      <option value='gestor'>Gestor</option>
                      <option value='admin'>Admin</option>
                    </select>
                  </td>
                  <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                  <td>
                    <select
                      value={u.clinica_id || ''}
                      onChange={e => atualizar(u.id, { clinica_id: e.target.value || null })}
                      style={{ background:'#0f172a', border:'1px solid #334155', color:'#e2e8f0', borderRadius:'4px', padding:'4px 8px', fontSize:'0.82rem' }}
                    >
                      <option value=''>-- Sem clínica --</option>
                      {clinicas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </td>
                  <td style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                    {u.status === 'pendente' && (
                      <button className='btn btn-success' style={{fontSize:'0.75rem',padding:'4px 10px'}} onClick={() => atualizar(u.id, { status: 'ativo' })}>✓ Aprovar</button>
                    )}
                    {u.status === 'ativo' && (
                      <button className='btn btn-danger' style={{fontSize:'0.75rem',padding:'4px 10px'}} onClick={() => atualizar(u.id, { status: 'inativo' })}>✗ Desativar</button>
                    )}
                    {u.status === 'inativo' && (
                      <button className='btn btn-warning' style={{fontSize:'0.75rem',padding:'4px 10px'}} onClick={() => atualizar(u.id, { status: 'ativo' })}>↺ Reativar</button>
                    )}
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
