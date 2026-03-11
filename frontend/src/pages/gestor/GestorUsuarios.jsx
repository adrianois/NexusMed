import { useEffect, useState } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import { useConfirm } from '../../components/ConfirmModal'
import { useToast } from '../../components/Toast'

const PERFIL_CFG = {
  normal:  { color: '#60a5fa', label: 'Normal'  },
  gestor:  { color: '#a78bfa', label: 'Gestor'  },
  medico:  { color: '#4ade80', label: '🩺 Médico' },
  admin:   { color: '#fb923c', label: 'Admin'   },
}

export default function GestorUsuarios() {
  const [usuarios,     setUsuarios]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [salvando,     setSalvando]     = useState(null)
  const { confirmar,   ConfirmModalUI } = useConfirm()
  const { toast,       ToastUI }        = useToast()

  const carregar = () => {
    setLoading(true)
    api.get('/gestor/usuarios/pendentes')
      .then(r => setUsuarios(r.data || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const aprovar = async (id, nome) => {
    const ok = await confirmar({
      titulo: 'Aprovar Usuário',
      mensagem: `Deseja aprovar o acesso de "${nome}"?`,
      labelOk: 'Aprovar',
      tipo: 'success',
    })
    if (!ok) return
    setSalvando(id)
    try {
      await api.patch(`/gestor/usuarios/${id}/aprovar`, { aprovado: true })
      toast(`"${nome}" aprovado com sucesso!`, 'success')
      carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
    finally { setSalvando(null) }
  }

  const rejeitar = async (id, nome) => {
    const ok = await confirmar({
      titulo: 'Rejeitar Usuário',
      mensagem: `Deseja rejeitar o acesso de "${nome}"? O status será definido como inativo.`,
      labelOk: 'Rejeitar',
      tipo: 'danger',
    })
    if (!ok) return
    setSalvando(id)
    try {
      await api.patch(`/gestor/usuarios/${id}/aprovar`, { aprovado: false })
      toast(`"${nome}" rejeitado.`, 'warning')
      carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
    finally { setSalvando(null) }
  }

  return (
    <PageLayout title='⏳ Aprovar Usuários'>
      <ConfirmModalUI /><ToastUI />

      {loading && <p className='page-loading'>Carregando...</p>}

      {!loading && usuarios.length === 0 && (
        <div className='page-vazio-box'>
          <span className='page-vazio-icon'>✅</span>
          <p>Nenhum usuário pendente de aprovação.</p>
        </div>
      )}

      {!loading && usuarios.length > 0 && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const cfg = PERFIL_CFG[u.perfil] || { color: '#64748b', label: u.perfil }
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.nome}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{u.email}</td>
                    <td>
                      <span style={{
                        background: `${cfg.color}18`,
                        color: cfg.color,
                        border: `1px solid ${cfg.color}44`,
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}>{cfg.label}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className='btn btn-success'
                          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                          disabled={salvando === u.id}
                          onClick={() => aprovar(u.id, u.nome)}
                        >
                          {salvando === u.id ? '...' : '✓ Aprovar'}
                        </button>
                        <button
                          className='btn btn-danger'
                          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                          disabled={salvando === u.id}
                          onClick={() => rejeitar(u.id, u.nome)}
                        >
                          ✕ Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}
