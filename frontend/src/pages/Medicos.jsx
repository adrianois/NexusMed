import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { useConfirm } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import './InnerPage.css'

const FORM_INICIAL = { nome: '', crm: '', especialidade: '', telefone: '', email: '' }
const USER_FORM    = { email: '', senha: '', confirmar: '' }

export default function Medicos() {
  const [medicos,     setMedicos]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [salvando,    setSalvando]    = useState(false)
  const [busca,       setBusca]       = useState('')
  const [form,        setForm]        = useState(FORM_INICIAL)
  // Modal de criar usuário
  const [modalUsuario, setModalUsuario] = useState(null) // medico obj
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

  const abrirNovo   = () => { setForm(FORM_INICIAL); setEditando(null); setMostrarForm(true) }
  const abrirEditar = m  => {
    setForm({ nome: m.nome||'', crm: m.crm||'', especialidade: m.especialidade||'', telefone: m.telefone||'', email: m.email||'' })
    setEditando(m.id); setMostrarForm(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome || !form.crm) { toast('Nome e CRM são obrigatórios!', 'error'); return }
    setSalvando(true)
    try {
      if (editando) { await api.put(`/medicos/${editando}`, form); toast('Médico atualizado!', 'success') }
      else          { await api.post('/medicos', form);            toast('Médico cadastrado!', 'success') }
      setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL); carregar()
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
      toast(`Usuário criado! O médico já pode acessar o sistema.`, 'success')
      setModalUsuario(null); setUserForm(USER_FORM); carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
    finally { setSalvandoUser(false) }
  }

  const filtrados = medicos.filter(m =>
    !busca || m.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    m.crm?.toLowerCase().includes(busca.toLowerCase()) ||
    m.especialidade?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <PageLayout title='👨‍⚕️ Médicos'>
      <ConfirmModalUI /><ToastUI />

      <div className='inner-toolbar'>
        <input className='form-input' style={{ maxWidth: '260px' }}
          placeholder='🔍 Buscar por nome, CRM ou especialidade...'
          value={busca} onChange={e => setBusca(e.target.value)} />
        <button className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => { if (mostrarForm) { setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL) } else abrirNovo() }}>
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
            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando...' : editando ? '✓ Atualizar' : '✓ Cadastrar'}
              </button>
              <button type='button' className='btn btn-secondary'
                onClick={() => { setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL) }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {!loading && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead><tr><th>Nome</th><th>CRM</th><th>Especialidade</th><th>Acesso</th><th>Ações</th></tr></thead>
            <tbody>
              {filtrados.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',color:'#64748b',padding:'2rem'}}>Nenhum médico encontrado.</td></tr>}
              {filtrados.map(m => (
                <tr key={m.id}>
                  <td style={{fontWeight:600}}>{m.nome}</td>
                  <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{m.crm||'—'}</td>
                  <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{m.especialidade||'—'}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar usuário médico */}
      {modalUsuario && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.8)',
          backdropFilter:'blur(8px)', display:'flex', alignItems:'center',
          justifyContent:'center', zIndex:200, padding:'1rem',
        }}>
          <div style={{
            background:'#0f172a', border:'1px solid rgba(96,165,250,0.2)',
            borderTop:'3px solid #60a5fa', borderRadius:'18px',
            padding:'28px 32px', width:'100%', maxWidth:'440px',
            boxShadow:'0 24px 48px rgba(0,0,0,0.6)',
          }}>
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
                <button type='submit' className='btn btn-success' disabled={salvandoUser}
                  style={{ flex:1, padding:'11px', fontWeight:700 }}>
                  {salvandoUser ? '⏳ Criando...' : '🔑 Criar Acesso'}
                </button>
                <button type='button' className='btn btn-secondary'
                  style={{ padding:'11px 18px' }}
                  onClick={() => setModalUsuario(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
