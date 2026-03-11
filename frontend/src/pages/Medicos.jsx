import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { useConfirm } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import './InnerPage.css'

const DIAS_SEMANA = [
  { key: 'seg', label: 'Segunda-feira' },
  { key: 'ter', label: 'Terça-feira'   },
  { key: 'qua', label: 'Quarta-feira'  },
  { key: 'qui', label: 'Quinta-feira'  },
  { key: 'sex', label: 'Sexta-feira'   },
  { key: 'sab', label: 'Sábado'        },
]

const HORARIOS_DISPONIVEIS = Array.from({ length: 29 }, (_, i) => {
  const total = 7 * 60 + i * 30
  const h = String(Math.floor(total / 60)).padStart(2, '0')
  const m = String(total % 60).padStart(2, '0')
  return `${h}:${m}`
})

const AGENDA_INICIAL = Object.fromEntries(DIAS_SEMANA.map(d => [d.key, []]))
const FORM_INICIAL   = { nome: '', crm: '', especialidade: '', telefone: '', email: '' }
const USER_FORM      = { email: '', senha: '', confirmar: '' }

export default function Medicos() {
  const [medicos,     setMedicos]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [salvando,    setSalvando]    = useState(false)
  const [busca,       setBusca]       = useState('')
  const [form,        setForm]        = useState(FORM_INICIAL)
  const [agenda,      setAgenda]      = useState(AGENDA_INICIAL)
  const [diaAberto,   setDiaAberto]   = useState(null)
  const [modalUsuario, setModalUsuario] = useState(null)
  const [userForm,     setUserForm]     = useState(USER_FORM)
  const [salvandoUser, setSalvandoUser] = useState(false)
  const { confirmar, ConfirmModalUI }   = useConfirm()
  const { toast, ToastUI }              = useToast()

  const carregar = () => {
    setLoading(true)
    api.get('/medicos').then(r => setMedicos(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const toggleHorario = (dia, hora) => {
    setAgenda(prev => {
      const atual = prev[dia] || []
      const nova  = atual.includes(hora) ? atual.filter(h => h !== hora) : [...atual, hora].sort()
      return { ...prev, [dia]: nova }
    })
  }

  const copiarParaTodos = (dia) => {
    const horarios = agenda[dia] || []
    setAgenda(prev => {
      const novo = { ...prev }
      DIAS_SEMANA.filter(d => d.key !== 'sab').forEach(d => { novo[d.key] = [...horarios] })
      return novo
    })
    toast('Horários copiados para todos os dias úteis!', 'success')
  }

  const abrirNovo = () => {
    setForm(FORM_INICIAL); setAgenda(AGENDA_INICIAL); setDiaAberto(null); setEditando(null); setMostrarForm(true)
  }

  const abrirEditar = m => {
    setForm({ nome: m.nome||'', crm: m.crm||'', especialidade: m.especialidade||'', telefone: m.telefone||'', email: m.email||'' })
    const agendaSalva    = m.agenda || {}
    const agendaCarregada = Object.fromEntries(DIAS_SEMANA.map(d => [d.key, agendaSalva[d.key] || []]))
    setAgenda(agendaCarregada); setDiaAberto(null); setEditando(m.id); setMostrarForm(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome || !form.crm) { toast('Nome e CRM são obrigatórios!', 'error'); return }
    setSalvando(true)
    try {
      const payload = { ...form, agenda }
      // ✔ PATCH para atualizar (backend usa PATCH /:id), POST para criar
      if (editando) { await api.patch(`/medicos/${editando}`, payload); toast('Médico atualizado!', 'success') }
      else          { await api.post('/medicos', payload);              toast('Médico cadastrado!', 'success') }
      setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL); setAgenda(AGENDA_INICIAL); carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
    finally { setSalvando(false) }
  }

  const excluir = async (id, nome) => {
    const ok = await confirmar({
      titulo: 'Excluir Médico',
      mensagem: `Deseja excluir o médico "${nome}"? Esta ação não pode ser desfeita.`,
      labelOk: 'Excluir', tipo: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/medicos/${id}`)
      toast('Médico excluído.', 'success'); carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
  }

  const salvarUsuario = async e => {
    e.preventDefault()
    if (!userForm.email || !userForm.senha) { toast('Email e senha são obrigatórios!', 'error'); return }
    if (userForm.senha !== userForm.confirmar) { toast('As senhas não coincidem!', 'error'); return }
    if (userForm.senha.length < 6) { toast('Senha deve ter pelo menos 6 caracteres!', 'error'); return }
    setSalvandoUser(true)
    try {
      await api.post('/medico/criar-usuario', { medico_id: modalUsuario.id, email: userForm.email, senha: userForm.senha })
      toast('Usuário criado! O médico já pode acessar o sistema.', 'success')
      setModalUsuario(null); setUserForm(USER_FORM); carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
    finally { setSalvandoUser(false) }
  }

  const filtrados = medicos.filter(m =>
    !busca || m.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    m.crm?.toLowerCase().includes(busca.toLowerCase()) ||
    m.especialidade?.toLowerCase().includes(busca.toLowerCase())
  )

  const totalHorarios = Object.values(agenda).reduce((acc, hrs) => acc + hrs.length, 0)

  return (
    <PageLayout title='👨‍⚕️ Médicos'>
      <ConfirmModalUI /><ToastUI />

      <div className='inner-toolbar'>
        <input className='form-input' style={{ maxWidth: '260px' }}
          placeholder='🔍 Buscar por nome, CRM ou especialidade...'
          value={busca} onChange={e => setBusca(e.target.value)} />
        <button className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => { if (mostrarForm) { setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL); setAgenda(AGENDA_INICIAL) } else abrirNovo() }}>
          {mostrarForm ? '✖ Cancelar' : '+ Novo Médico'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>{editando ? '✏️ Editar Médico' : 'Cadastrar Novo Médico'}</h3>
          <form onSubmit={handleSubmit} className='inner-form'>
            <div className='form-field form-field--full'>
              <label className='form-label'>Nome completo <span className='required'>*</span></label>
              <input className='form-input' name='nome' value={form.nome} onChange={handleChange} placeholder='Dr(a). Nome Sobrenome' required />
            </div>
            <div className='form-field'>
              <label className='form-label'>CRM <span className='required'>*</span></label>
              <input className='form-input' name='crm' value={form.crm} onChange={handleChange} placeholder='CRM/UF 000000' required />
            </div>
            <div className='form-field'>
              <label className='form-label'>Especialidade</label>
              <input className='form-input' name='especialidade' value={form.especialidade} onChange={handleChange} placeholder='Ex: Cardiologia' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Telefone</label>
              <input className='form-input' name='telefone' value={form.telefone} onChange={handleChange} placeholder='(00) 00000-0000' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Email</label>
              <input className='form-input' type='email' name='email' value={form.email} onChange={handleChange} placeholder='email@clinica.com' />
            </div>

            <div className='form-field form-field--full' style={{ marginTop: '8px' }}>
              <div className='form-section-divider'>
                <span>📅 Agenda Semanal
                  {totalHorarios > 0 && (
                    <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#4ade80', fontWeight: 400 }}>
                      ({totalHorarios} horário{totalHorarios !== 1 ? 's' : ''} configurado{totalHorarios !== 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {DIAS_SEMANA.map(({ key, label }) => {
              const aberto   = diaAberto === key
              const horarios = agenda[key] || []
              return (
                <div key={key} className='form-field form-field--full'>
                  <div onClick={() => setDiaAberto(aberto ? null : key)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:'10px', cursor:'pointer', userSelect:'none',
                      background: horarios.length > 0 ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${horarios.length > 0 ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontSize:'0.9rem', color: horarios.length > 0 ? '#4ade80' : '#64748b' }}>
                        {horarios.length > 0 ? '✅' : '⬜'}
                      </span>
                      <span style={{ color:'#e2e8f0', fontSize:'0.88rem', fontWeight:600 }}>{label}</span>
                      {horarios.length > 0 && (
                        <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>
                          {horarios.length} horário{horarios.length !== 1 ? 's' : ''}: {horarios.slice(0,3).join(', ')}{horarios.length > 3 ? '...' : ''}
                        </span>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      {horarios.length > 0 && (
                        <button type='button' onClick={e => { e.stopPropagation(); copiarParaTodos(key) }}
                          style={{ fontSize:'0.7rem', padding:'3px 8px', borderRadius:'6px', background:'rgba(96,165,250,0.15)', border:'1px solid rgba(96,165,250,0.3)', color:'#60a5fa', cursor:'pointer' }}>
                          📋 Copiar para todos
                        </button>
                      )}
                      <span style={{ color:'#475569', fontSize:'0.8rem' }}>{aberto ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {aberto && (
                    <div style={{ marginTop:'6px', padding:'14px', background:'rgba(15,23,42,0.8)', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ color:'#64748b', fontSize:'0.75rem', marginBottom:'10px' }}>Clique para ativar/desativar horários:</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                        {HORARIOS_DISPONIVEIS.map(hora => {
                          const ativo = horarios.includes(hora)
                          return (
                            <button key={hora} type='button' onClick={() => toggleHorario(key, hora)}
                              style={{ padding:'5px 11px', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', fontWeight:600, transition:'all 0.15s',
                                background: ativo ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.04)',
                                border:     ativo ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                color:      ativo ? '#4ade80' : '#64748b',
                              }}>{hora}</button>
                          )
                        })}
                      </div>
                      {horarios.length > 0 && (
                        <button type='button' onClick={() => setAgenda(prev => ({ ...prev, [key]: [] }))}
                          style={{ marginTop:'10px', fontSize:'0.72rem', padding:'4px 10px', borderRadius:'6px', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', cursor:'pointer' }}>
                          🗑️ Limpar {label}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando...' : editando ? '✓ Atualizar' : '✓ Cadastrar'}
              </button>
              <button type='button' className='btn btn-secondary'
                onClick={() => { setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL); setAgenda(AGENDA_INICIAL) }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {!loading && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead><tr><th>Nome</th><th>CRM</th><th>Especialidade</th><th>Agenda</th><th>Acesso</th><th>Ações</th></tr></thead>
            <tbody>
              {filtrados.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#64748b',padding:'2rem'}}>Nenhum médico encontrado.</td></tr>}
              {filtrados.map(m => {
                const totalHrs   = Object.values(m.agenda || {}).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0)
                const diasAtivos = Object.entries(m.agenda || {}).filter(([, v]) => Array.isArray(v) && v.length > 0).length
                return (
                  <tr key={m.id}>
                    <td style={{fontWeight:600}}>{m.nome}</td>
                    <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{m.crm||'—'}</td>
                    <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{m.especialidade||'—'}</td>
                    <td>
                      {diasAtivos > 0
                        ? <span style={{ fontSize:'0.78rem', color:'#4ade80' }}>📅 {diasAtivos} dia{diasAtivos!==1?'s':''} · {totalHrs} horário{totalHrs!==1?'s':''}</span>
                        : <span style={{ fontSize:'0.78rem', color:'#475569' }}>Sem agenda</span>
                      }
                    </td>
                    <td>
                      {m.usuario_id
                        ? <span style={{ background:'rgba(34,197,94,0.12)', color:'#4ade80', border:'1px solid rgba(34,197,94,0.3)', padding:'2px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:700 }}>✅ Usuário ativo</span>
                        : <button className='btn btn-primary' style={{fontSize:'0.75rem',padding:'4px 12px'}} onClick={() => { setModalUsuario(m); setUserForm(USER_FORM) }}>🔑 Criar Acesso</button>
                      }
                    </td>
                    <td>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button className='btn btn-secondary' style={{fontSize:'0.78rem',padding:'5px 10px'}} onClick={() => abrirEditar(m)}>✏️ Editar</button>
                        <button className='btn btn-danger'    style={{fontSize:'0.78rem',padding:'5px 10px'}} onClick={() => excluir(m.id, m.nome)}>🗑️ Excluir</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalUsuario && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }}>
          <div style={{ background:'#0f172a', border:'1px solid rgba(96,165,250,0.2)', borderTop:'3px solid #60a5fa', borderRadius:'18px', padding:'28px 32px', width:'100%', maxWidth:'440px', boxShadow:'0 24px 48px rgba(0,0,0,0.6)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div>
                <h3 style={{ color:'#60a5fa', margin:0, fontSize:'1rem', fontWeight:700 }}>🔑 Criar Acesso ao Sistema</h3>
                <p style={{ color:'#475569', fontSize:'0.8rem', margin:'5px 0 0' }}>{modalUsuario.nome}</p>
              </div>
              <button onClick={() => setModalUsuario(null)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'#64748b', fontSize:'1.1rem', cursor:'pointer', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
            <form onSubmit={salvarUsuario}>
              <div style={{ marginBottom:'14px' }}>
                <label className='form-label' style={{ display:'block', marginBottom:'5px' }}>Email de acesso <span style={{color:'#f87171'}}>*</span></label>
                <input className='form-input' type='email' value={userForm.email}
                  onChange={e => setUserForm(p => ({...p, email: e.target.value}))}
                  placeholder='email@medico.com' required style={{ width:'100%', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:'14px' }}>
                <label className='form-label' style={{ display:'block', marginBottom:'5px' }}>Senha <span style={{color:'#f87171'}}>*</span></label>
                <input className='form-input' type='password' value={userForm.senha}
                  onChange={e => setUserForm(p => ({...p, senha: e.target.value}))}
                  placeholder='Mínimo 6 caracteres' required style={{ width:'100%', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:'22px' }}>
                <label className='form-label' style={{ display:'block', marginBottom:'5px' }}>Confirmar Senha <span style={{color:'#f87171'}}>*</span></label>
                <input className='form-input' type='password' value={userForm.confirmar}
                  onChange={e => setUserForm(p => ({...p, confirmar: e.target.value}))}
                  placeholder='Repita a senha' required style={{ width:'100%', boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button type='submit' className='btn btn-success' disabled={salvandoUser} style={{ flex:1, padding:'11px', fontWeight:700 }}>
                  {salvandoUser ? '⏳ Criando...' : '🔑 Criar Acesso'}
                </button>
                <button type='button' className='btn btn-secondary' style={{ padding:'11px 18px' }} onClick={() => setModalUsuario(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
