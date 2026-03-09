import { useEffect, useState } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [clinicas, setClinicas] = useState([])
  const [loading, setLoading]   = useState(true)
  const [editando, setEditando] = useState({}) // { [id]: { perfil, clinica_id } }
  const [salvando, setSalvando] = useState(null)

  const carregar = () => {
    setLoading(true)
    Promise.all([api.get('/admin/usuarios'), api.get('/admin/clinicas')])
      .then(([ru, rc]) => {
        const users = ru.data || []
        const clinicasList = rc.data || []
        setUsuarios(users)
        setClinicas(clinicasList)
        // Inicializa estado de edição com valores atuais
        const inicial = {}
        users.forEach(u => {
          inicial[u.id] = { perfil: u.perfil || 'normal', clinica_id: u.clinica_id || '' }
        })
        setEditando(inicial)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const handleEdit = (id, campo, valor) => {
    setEditando(prev => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }))
  }

  const salvarUsuario = async (id) => {
    setSalvando(id)
    try {
      const { perfil, clinica_id } = editando[id]
      await api.patch(`/admin/usuarios/${id}`, {
        perfil,
        clinica_id: clinica_id || null
      })
      carregar()
      alert('Usuário atualizado com sucesso!')
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message))
    } finally {
      setSalvando(null)
    }
  }

  const alterarStatus = async (id, novoStatus) => {
    try {
      await api.patch(`/admin/usuarios/${id}`, { status: novoStatus })
      carregar()
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message))
    }
  }

  const getNomeClinica = id => clinicas.find(c => c.id === id)?.nome || '-'

  return (
    <PageLayout title='👤 Gerenciar Usuários'>

      {clinicas.length === 0 && !loading && (
        <div style={{ background:'#451a03', border:'1px solid #f59e0b', borderRadius:'8px', padding:'14px 18px', marginBottom:'20px', color:'#fbbf24', fontSize:'0.88rem' }}>
          ⚠️ Nenhuma clínica cadastrada. <strong>Cadastre uma clínica primeiro</strong> para conseguir vincular usuários.
          <a href='/admin/clinicas' style={{ color:'#38bdf8', marginLeft:'8px', textDecoration:'underline' }}>Ir para Clínicas →</a>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}

      {!loading && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Clínica</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:'center',color:'#64748b',padding:'2rem'}}>Nenhum usuário encontrado.</td></tr>
              )}
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight:600}}>{u.nome}</td>
                  <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{u.email}</td>

                  {/* Perfil */}
                  <td>
                    <select
                      value={editando[u.id]?.perfil || 'normal'}
                      onChange={e => handleEdit(u.id, 'perfil', e.target.value)}
                      style={{ background:'#1e293b', border:'1px solid #475569', color:'#e2e8f0', borderRadius:'6px', padding:'5px 8px', fontSize:'0.82rem', width:'100%' }}
                    >
                      <option value='normal'>Normal</option>
                      <option value='gestor'>Gestor</option>
                      <option value='admin'>Admin</option>
                    </select>
                  </td>

                  {/* Clínica */}
                  <td>
                    <select
                      value={editando[u.id]?.clinica_id || ''}
                      onChange={e => handleEdit(u.id, 'clinica_id', e.target.value)}
                      style={{ background:'#1e293b', border:'1px solid #475569', color:'#e2e8f0', borderRadius:'6px', padding:'5px 8px', fontSize:'0.82rem', width:'100%', minWidth:'160px' }}
                    >
                      <option value=''>-- Sem clínica --</option>
                      {clinicas.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} {!c.ativo ? '(inativa)' : ''}</option>
                      ))}
                    </select>
                  </td>

                  {/* Status */}
                  <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>

                  {/* Ações */}
                  <td>
                    <div style={{display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center'}}>
                      {/* Botão Salvar perfil/clínica */}
                      <button
                        className='btn btn-primary'
                        style={{fontSize:'0.75rem', padding:'5px 12px'}}
                        disabled={salvando === u.id}
                        onClick={() => salvarUsuario(u.id)}
                      >
                        {salvando === u.id ? '...' : '💾 Salvar'}
                      </button>

                      {/* Botões de status */}
                      {u.status === 'pendente' && (
                        <button className='btn btn-success' style={{fontSize:'0.75rem',padding:'5px 12px'}} onClick={() => alterarStatus(u.id, 'ativo')}>✓ Aprovar</button>
                      )}
                      {u.status === 'ativo' && (
                        <button className='btn btn-danger' style={{fontSize:'0.75rem',padding:'5px 12px'}} onClick={() => alterarStatus(u.id, 'inativo')}>✕ Desativar</button>
                      )}
                      {u.status === 'inativo' && (
                        <button className='btn btn-warning' style={{fontSize:'0.75rem',padding:'5px 12px'}} onClick={() => alterarStatus(u.id, 'ativo')}>↺ Reativar</button>
                      )}
                    </div>
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
