import { useState } from 'react'
import api from '../api'

// Fora do componente para evitar remontagem a cada render
function CampoSenha({ id, label, value, onChange, mostrar, onToggle }) {
  return (
    <div className='form-field form-field--full'>
      <label className='form-label'>{label} <span className='required'>*</span></label>
      <div style={{ position:'relative' }}>
        <input
          className='form-input'
          type={mostrar ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(id, e.target.value)}
          required
          autoComplete='new-password'
          style={{ paddingRight:'40px' }}
        />
        <button type='button' onClick={() => onToggle(id)}
          style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:'1rem' }}>
          {mostrar ? '👁️' : '👁'}
        </button>
      </div>
    </div>
  )
}

export default function ModalTrocarSenha({ usuarioAlvo, perfilLogado, usuarioLogadoId, onFechar }) {
  const ehProprioUsuario = usuarioAlvo?.id === usuarioLogadoId
  const exigeSenhaAtual  = ehProprioUsuario && perfilLogado !== 'admin'

  const [form, setForm]         = useState({ senha_atual: '', nova_senha: '', confirmar: '' })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg]           = useState(null)
  const [mostrar, setMostrar]   = useState({ senha_atual: false, nova_senha: false, confirmar: false })

  const handleChange = (id, valor) => setForm(prev => ({ ...prev, [id]: valor }))
  const toggle = id => setMostrar(prev => ({ ...prev, [id]: !prev[id] }))

  const handleSubmit = async e => {
    e.preventDefault()
    setMsg(null)
    if (form.nova_senha.length < 6)
      return setMsg({ tipo:'erro', texto:'A nova senha deve ter no mínimo 6 caracteres.' })
    if (form.nova_senha !== form.confirmar)
      return setMsg({ tipo:'erro', texto:'As senhas não coincidem.' })
    setSalvando(true)
    try {
      const payload = { nova_senha: form.nova_senha }
      if (exigeSenhaAtual) payload.senha_atual = form.senha_atual
      const res = await api.patch(`/usuarios/${usuarioAlvo.id}/senha`, payload)
      setMsg({ tipo:'ok', texto: res.data.message })
      setForm({ senha_atual: '', nova_senha: '', confirmar: '' })
      setTimeout(() => onFechar(), 1800)
    } catch (err) {
      setMsg({ tipo:'erro', texto: err.response?.data?.error || err.message })
    } finally { setSalvando(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={e => { if (e.target === e.currentTarget) onFechar() }}>
      <div style={{ background:'#1e293b', borderRadius:'12px', padding:'28px', width:'100%', maxWidth:'420px',
        border:'1px solid #334155', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>

        <h3 style={{ margin:'0 0 4px', color:'#e2e8f0', fontSize:'1.1rem' }}>🔒 Trocar Senha</h3>
        <p style={{ margin:'0 0 20px', color:'#64748b', fontSize:'0.82rem' }}>
          Usuário: <strong style={{color:'#93c5fd'}}>{usuarioAlvo?.nome}</strong>
          {!ehProprioUsuario && perfilLogado === 'admin'  && <span style={{color:'#fbbf24'}}> — reset por admin</span>}
          {!ehProprioUsuario && perfilLogado === 'gestor' && <span style={{color:'#fbbf24'}}> — reset por gestor</span>}
        </p>

        <form onSubmit={handleSubmit} className='inner-form'>
          {exigeSenhaAtual && (
            <CampoSenha id='senha_atual' label='Senha Atual'
              value={form.senha_atual} onChange={handleChange}
              mostrar={mostrar.senha_atual} onToggle={toggle} />
          )}
          <CampoSenha id='nova_senha' label='Nova Senha'
            value={form.nova_senha} onChange={handleChange}
            mostrar={mostrar.nova_senha} onToggle={toggle} />
          <CampoSenha id='confirmar' label='Confirmar Nova Senha'
            value={form.confirmar} onChange={handleChange}
            mostrar={mostrar.confirmar} onToggle={toggle} />

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
            <button type='button' className='btn btn-secondary' onClick={onFechar}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
