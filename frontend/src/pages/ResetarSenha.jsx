import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import './Login.css'

function CampoSenha({ id, label, placeholder, value, onChange, mostrar, onToggle }) {
  return (
    <div style={{textAlign:'left',marginBottom:'12px'}}>
      <label style={{display:'block',marginBottom:'4px',color:'#374151',fontWeight:600,fontSize:'0.88rem'}}>{label}</label>
      <div style={{position:'relative'}}>
        <input
          type={mostrar ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(id, e.target.value)}
          required
          autoComplete='new-password'
          style={{paddingRight:'44px',width:'100%',boxSizing:'border-box',
            padding:'0.85rem 2.8rem 0.85rem 1rem',border:'1px solid #ccc',
            borderRadius:'8px',fontSize:'1rem'}}
        />
        <button type='button' onClick={() => onToggle(id)}
          style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',
            background:'none',border:'none',cursor:'pointer',color:'#6b7280',fontSize:'1.1rem'}}>
          {mostrar ? '👁️' : '👁'}
        </button>
      </div>
    </div>
  )
}

export default function ResetarSenha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm]         = useState({ nova_senha: '', confirmar: '' })
  const [mostrar, setMostrar]   = useState({ nova_senha: false, confirmar: false })
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState(null)
  const [sucesso, setSucesso]   = useState(false)

  useEffect(() => {
    if (!token) setMsg({ tipo:'erro', texto:'Link inv\u00e1lido. Solicite um novo.' })
  }, [token])

  const handleChange = (id, valor) => setForm(prev => ({ ...prev, [id]: valor }))
  const toggle = id => setMostrar(prev => ({ ...prev, [id]: !prev[id] }))

  const handleSubmit = async e => {
    e.preventDefault()
    setMsg(null)
    if (form.nova_senha.length < 6)
      return setMsg({ tipo:'erro', texto:'A senha deve ter no m\u00ednimo 6 caracteres.' })
    if (form.nova_senha !== form.confirmar)
      return setMsg({ tipo:'erro', texto:'As senhas n\u00e3o coincidem.' })
    setLoading(true)
    try {
      const res = await api.post('/auth/resetar-senha', { token, nova_senha: form.nova_senha })
      setMsg({ tipo:'ok', texto: res.data.message })
      setSucesso(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setMsg({ tipo:'erro', texto: err.response?.data?.error || 'Erro ao redefinir senha.' })
    } finally { setLoading(false) }
  }

  return (
    <div className='login-container'>
      <div className='login-box'>
        <div style={{fontSize:'2.5rem',marginBottom:'8px'}}>🔐</div>
        <h2 style={{marginBottom:'6px'}}>Nova senha</h2>
        <p style={{color:'#64748b',fontSize:'0.88rem',marginBottom:'20px'}}>
          Defina sua nova senha abaixo.
        </p>

        {msg && (
          <div style={{
            padding:'12px 14px', borderRadius:'8px', marginBottom:'16px',
            background: msg.tipo==='ok' ? '#dcfce7' : '#fee2e2',
            color:      msg.tipo==='ok' ? '#166534' : '#991b1b',
            fontSize:'0.88rem', fontWeight:600
          }}>
            {msg.tipo==='ok' ? '✅' : '❌'} {msg.texto}
            {sucesso && <p style={{margin:'6px 0 0',fontWeight:400,fontSize:'0.82rem'}}>Redirecionando para o login...</p>}
          </div>
        )}

        {!sucesso && token && (
          <form onSubmit={handleSubmit}>
            <CampoSenha id='nova_senha' label='Nova Senha' placeholder='M\u00ednimo 6 caracteres'
              value={form.nova_senha} onChange={handleChange}
              mostrar={mostrar.nova_senha} onToggle={toggle} />
            <CampoSenha id='confirmar' label='Confirmar Nova Senha' placeholder='Repita a senha'
              value={form.confirmar} onChange={handleChange}
              mostrar={mostrar.confirmar} onToggle={toggle} />
            <button type='submit' className='primary' disabled={loading} style={{marginTop:'8px'}}>
              {loading ? 'Salvando...' : '🔒 Redefinir Senha'}
            </button>
          </form>
        )}

        <p style={{marginTop:'16px'}}>
          <button onClick={() => navigate('/login')}>← Voltar ao login</button>
        </p>
      </div>
    </div>
  )
}
