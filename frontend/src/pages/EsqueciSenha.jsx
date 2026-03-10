import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Login.css'

export default function EsqueciSenha() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState(null)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await api.post('/auth/esqueci-senha', { email })
      setMsg({ tipo: 'ok', texto: res.data.message })
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao processar solicita\u00e7\u00e3o.' })
    } finally { setLoading(false) }
  }

  return (
    <div className='login-container'>
      <div className='login-box'>
        <div style={{fontSize:'2.5rem',marginBottom:'8px'}}>🔐</div>
        <h2 style={{marginBottom:'6px'}}>Esqueci minha senha</h2>
        <p style={{color:'#64748b',fontSize:'0.88rem',marginBottom:'20px'}}>
          Digite seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        {msg ? (
          <div style={{
            padding:'14px 16px', borderRadius:'8px', marginBottom:'16px',
            background: msg.tipo==='ok' ? '#dcfce7' : '#fee2e2',
            color:      msg.tipo==='ok' ? '#166534' : '#991b1b',
            fontSize:'0.9rem', fontWeight:600
          }}>
            {msg.tipo==='ok' ? '✅' : '❌'} {msg.texto}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type='email'
              placeholder='Digite seu e-mail'
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type='submit' className='primary' disabled={loading}>
              {loading ? 'Enviando...' : '📧 Enviar link'}
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
