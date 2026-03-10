import { useEffect, useState, useContext } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { AuthContext } from '../context/AuthContext'
import './InnerPage.css'

const PERFIL_CONFIG = {
  admin:  { bg:'#450a0a', color:'#fca5a5', label:'Admin'  },
  gestor: { bg:'#1c1917', color:'#fbbf24', label:'Gestor' },
  normal: { bg:'#1e293b', color:'#94a3b8', label:'Normal' },
}
const STATUS_CONFIG = {
  ativo:    { bg:'#14532d', color:'#86efac', label:'Ativo'    },
  pendente: { bg:'#78350f', color:'#fcd34d', label:'Pendente' },
  inativo:  { bg:'#1e293b', color:'#64748b', label:'Inativo'  },
}

export default function Usuarios() {
  const { usuario } = useContext(AuthContext)
  const perfil = usuario?.perfil

  const [usuarios, setUsuarios]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [erro, setErro]           = useState(null)
  const [modalId, setModalId]     = useState(null)   // id do usuario com modal aberto
  const [form, setForm]           = useState({ senha_atual: '', nova_senha: '', confirmar: '' })
  const [salvando, setSalvando]   = useState(false)
  const [msg, setMsg]             = useState(null)    // { tipo: 'ok'|'erro', texto }
  const [mostrar, setMostrar]     = useState({ atual: false, nova: false, confirmar: false })

  const carregar = () => {
    setLoading(true)
    api.get('/usuarios')
      .then(r => setUsuarios(r.data || []))
      .catch(() => setErro('Erro ao carregar usuários.'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const abrirModal = (id) => {
    setModalId(id)
    setForm({ senha_atual: '', nova_senha: '', confirmar: '' })
    setMsg(null)
    setMostrar({ atual: false, nova: false, confirmar: false })
  }
  const fecharModal = () => { setModalId(null); setMsg(null) }

  const ehProprioUsuario = modalId === usuario?.usuario_id
  const usuarioAlvo = usuarios.find(u => u.id === modalId)

  const handleSubmit = async e => {
    e.preventDefault()
    setMsg(null)
    if (form.nova_senha.length < 6) return setMsg({ tipo:'erro', texto:'A nova senha deve ter no mínimo 6 caracteres.' })
    if (form.nova_senha !== form.confirmar) return setMsg({ tipo:'erro', texto:'As senhas não coincidem.' })
    setSalvando(true)
    try {
      const payload = { nova_senha: form.nova_senha }
      if (ehProprioUsuario && perfil !== 'admin') payload.senha_atual = form.senha_atual
      const res = await api.patch(`/usuarios/${modalId}/senha`, payload)
      setMsg({ tipo:'ok', texto: res.data.message })
      setForm({ senha_atual: '', nova_senha: '', confirmar: '' })
      setTimeout(() => fecharModal(), 1800)
    } catch (err) {
      setMsg({ tipo:'erro', texto: err.response?.data?.error || err.message })
    } finally { setSalvando(false) }
  }

  const toggle = campo => setMostrar(prev => ({ ...prev, [campo]: !prev[campo] }))

  const inputSenha = (campo, label, placeholder) => (
    <div className='form-field form-field--full'>
      <label className='form-label'>{label} <span className='required'>*</span></label>
      <div style={{ position:'relative' }}>
        <input
          className='form-input'
          type={mostrar[campo] ? 'text' : 'password'}
          value={form[campo]}
          onChange={e => setForm(prev => ({...prev, [campo]: e.target.value}))}
          placeholder={placeholder}
          required
          autoComplete='new-password'
          style={{ paddingRight:'40px' }}
        />
        <button type='button' onClick={() => toggle(campo)}
          style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:'1rem' }}>
          {mostrar[campo] ? '👁️' : '👁'}
        </button>
      </div>
    </div>
  )

  return (
    <PageLayout title='👥 Usuários'>

      {/* Modal de troca de senha */}
      {modalId && usuarioAlvo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
          onClick={e => { if(e.target===e.currentTarget) fecharModal() }}>
          <div style={{ background:'#1e293b', borderRadius:'12px', padding:'28px', width:'100%', maxWidth:'420px',
            border:'1px solid #334155', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin:'0 0 4px', color:'#e2e8f0', fontSize:'1.1rem' }}>🔒 Trocar Senha</h3>
            <p style={{ margin:'0 0 20px', color:'#64748b', fontSize:'0.82rem' }}>
              Usuário: <strong style={{color:'#93c5fd'}}>{usuarioAlvo.nome}</strong>
              {!ehProprioUsuario && perfil === 'admin' && <span style={{color:'#fbbf24'}}> (reset por admin)</span>}
              {!ehProprioUsuario && perfil === 'gestor' && <span style={{color:'#fbbf24'}}> (reset por gestor)</span>}
            </p>
            <form onSubmit={handleSubmit} className='inner-form'>
              {/* Exige senha atual apenas se for o proprio usuario e nao for admin */}
              {ehProprioUsuario && perfil !== 'admin' && (
                inputSenha('senha_atual', 'Senha Atual', 'Digite sua senha atual')
              )}
              {inputSenha('nova_senha', 'Nova Senha', 'Mínimo 6 caracteres')}
              {inputSenha('confirmar', 'Confirmar Nova Senha', 'Repita a nova senha')}

              {msg && (
                <div style={{ padding:'10px 14px', borderRadius:'6px', fontSize:'0.82rem', fontWeight:600,
                  background: msg.tipo==='ok' ? '#14532d' : '#450a0a',
                  color:      msg.tipo==='ok' ? '#86efac' : '#fca5a5',
                  border: `1px solid ${msg.tipo==='ok' ? '#166534' : '#7f1d1d'}` }}>
                  {msg.tipo==='ok' ? '✅' : '❌'} {msg.texto}
                </div>
              )}

              <div className='form-actions'>
                <button type='submit' className='btn btn-success' disabled={salvando}>
                  {salvando ? 'Salvando...' : '🔒 Salvar Nova Senha'}
                </button>
                <button type='button' className='btn btn-secondary' onClick={fecharModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {erro    && <p className='page-erro'>{erro}</p>}

      {!loading && !erro && (
        usuarios.length === 0
          ? <div className='page-vazio-box'><span className='page-vazio-icon'>👤</span><p>Nenhum usuário encontrado.</p></div>
          : (
            <div className='table-wrapper'>
              <table className='data-table'>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Perfil</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => {
                    const pc = PERFIL_CONFIG[u.perfil]  || PERFIL_CONFIG.normal
                    const sc = STATUS_CONFIG[u.status]  || STATUS_CONFIG.inativo
                    const ehVoce = u.id === usuario?.usuario_id
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight:600 }}>
                          {u.nome}
                          {ehVoce && <span style={{ marginLeft:'6px', fontSize:'0.7rem', color:'#3b82f6', background:'#1e3a5f', padding:'1px 6px', borderRadius:'8px' }}>você</span>}
                        </td>
                        <td style={{ color:'#94a3b8', fontSize:'0.85rem' }}>{u.email}</td>
                        <td>
                          <span style={{ background:pc.bg, color:pc.color, padding:'3px 9px', borderRadius:'12px', fontSize:'0.72rem', fontWeight:700 }}>
                            {pc.label}
                          </span>
                        </td>
                        <td>
                          <span style={{ background:sc.bg, color:sc.color, padding:'3px 9px', borderRadius:'12px', fontSize:'0.72rem', fontWeight:700 }}>
                            {sc.label}
                          </span>
                        </td>
                        <td>
                          <button
                            className='btn'
                            style={{ fontSize:'0.72rem', padding:'4px 10px', background:'#1e3a5f', color:'#93c5fd', border:'1px solid #1d4ed8' }}
                            onClick={() => abrirModal(u.id)}>
                            🔒 Trocar Senha
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
      )}
    </PageLayout>
  )
}
