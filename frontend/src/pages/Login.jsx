import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [email, setEmail]   = useState('')
  const [senha, setSenha]   = useState('')
  const [error, setError]   = useState(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleLogin = async e => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, senha)
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Email ou senha incorretos.')
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className='login-container'>
      <div className='login-box'>
        <div style={{fontSize:'2.5rem',marginBottom:'4px'}}>🏥</div>
        <h2>NexusMed</h2>
        <form onSubmit={handleLogin}>
          <input
            type='email'
            placeholder='Digite seu e-mail'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type='password'
            placeholder='Digite sua senha'
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
          />
          <button type='submit' className='primary' disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {error && <p style={{color:'#dc2626',marginTop:'8px',fontSize:'0.9rem'}}>{error}</p>}

        <p style={{marginTop:'8px'}}>
          <button onClick={() => navigate('/esqueci-senha')}>Esqueci minha senha</button>
        </p>
        <p>
          N\u00e3o tem conta?{' '}
          <button onClick={() => navigate('/register')}>Registrar</button>
        </p>
      </div>
    </div>
  )
}
