import { useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import './InnerPage.css'

export default function MinhaSenha() {
  const { user } = useAuth()

  const [form, setForm]         = useState({ senha_atual: '', nova_senha: '', confirmar: '' })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg]           = useState(null)
  const [mostrar, setMostrar]   = useState({ senha_atual: false, nova_senha: false, confirmar: false })

  const toggle = campo => setMostrar(prev => ({ ...prev, [campo]: !prev[campo] }))

  const handleSubmit = async e => {
    e.preventDefault()
    setMsg(null)
    if (form.nova_senha.length < 6)
      return setMsg({ tipo:'erro', texto:'A nova senha deve ter no mínimo 6 caracteres.' })
    if (form.nova_senha !== form.confirmar)
      return setMsg({ tipo:'erro', texto:'As senhas não coincidem.' })
    setSalvando(true)
    try {
      const res = await api.patch(`/usuarios/${user.usuario_id}/senha`, {
        senha_atual: form.senha_atual,
        nova_senha: form.nova_senha
      })
      setMsg({ tipo:'ok', texto: res.data.message })
      setForm({ senha_atual: '', nova_senha: '', confirmar: '' })
    } catch (err) {
      setMsg({ tipo:'erro', texto: err.response?.data?.error || err.message })
    } finally { setSalvando(false) }
  }

  const Campo = ({ id, label, placeholder }) => (
    <div className='form-field form-field--full'>
      <label className='form-label'>{label} <span className='required'>*</span></label>
      <div style={{ position:'relative' }}>
        <input
          className='form-input'
          type={mostrar[id] ? 'text' : 'password'}
          value={form[id]}
          onChange={e => setForm(prev => ({ ...prev, [id]: e.target.value }))}
          placeholder={placeholder}
          required
          autoComplete='new-password'
          style={{ paddingRight:'40px' }}
        />
        <button type='button' onClick={() => toggle(id)}
          style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:'1rem' }}>
          {mostrar[id] ? '👁️' : '👁'}
        </button>
      </div>
    </div>
  )

  return (
    <PageLayout title='🔒 Minha Senha'>
      <div className='inner-card' style={{maxWidth:'480px'}}>
        <h3 className='inner-card-title'>Alterar Senha</h3>
        <p style={{color:'#64748b',fontSize:'0.85rem',marginBottom:'16px'}}>
          Usuário: <strong style={{color:'#93c5fd'}}>{user?.nome}</strong>
        </p>

        <form onSubmit={handleSubmit} className='inner-form'>
          <Campo id='senha_atual' label='Senha Atual'       placeholder='Digite sua senha atual' />
          <Campo id='nova_senha'  label='Nova Senha'        placeholder='Mínimo 6 caracteres' />
          <Campo id='confirmar'   label='Confirmar Nova Senha' placeholder='Repita a nova senha' />

          {msg && (
            <div style={{ padding:'10px 14px', borderRadius:'6px', fontSize:'0.85rem', fontWeight:600,
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
          </div>
        </form>
      </div>
    </PageLayout>
  )
}
