import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Register.css'

export default function Register() {
  const [nome, setNome]         = useState('')
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [perfil, setPerfil]     = useState('normal')
  const [clinicaId, setClinicaId] = useState('')
  const [clinicas, setClinicas] = useState([])
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMsg, setModalMsg] = useState('')
  const navigate = useNavigate()

  // Busca clínicas ativas para o select
  useEffect(() => {
    api.get('/clinicas/publicas')
      .then(r => setClinicas(r.data || []))
      .catch(() => setClinicas([]))
  }, [])

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/register', {
        nome,
        email,
        senha,
        perfil,
        clinica_id: clinicaId || null
      })
      if (perfil === 'gestor') {
        setModalMsg('Seu cadastro como Gestor foi realizado! Aguarde a aprovação do Administrador.')
      } else {
        setModalMsg('Cadastro realizado! Aguarde a aprovação do Gestor ou Administrador da clínica.')
      }
      setShowModal(true)
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.error || err.response?.data?.message
      if (status === 409) setError('Este e-mail já está cadastrado.')
      else if (msg) setError(msg)
      else setError('Erro ao registrar. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='register-container'>
      <div className='register-box'>
        <div className='register-logo'>
          <span>🏥</span>
          <span>NexusMed</span>
        </div>
        <h2>Criar Conta</h2>

        <form onSubmit={handleRegister}>
          <div className='register-field'>
            <label>Nome completo</label>
            <input
              type='text'
              placeholder='Digite seu nome'
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>

          <div className='register-field'>
            <label>E-mail</label>
            <input
              type='email'
              placeholder='seu@email.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className='register-field'>
            <label>Senha</label>
            <input
              type='password'
              placeholder='Mínimo 6 caracteres'
              value={senha}
              onChange={e => setSenha(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className='register-field'>
            <label>Tipo de Usuário</label>
            <select value={perfil} onChange={e => setPerfil(e.target.value)}>
              <option value='normal'>👤 Usuário Normal</option>
              <option value='gestor'>🏢 Gestor de Clínica</option>
            </select>
          </div>

          <div className='register-field'>
            <label>Clínica {perfil === 'normal' ? '(obrigatório)' : '(opcional para Gestor)'}</label>
            <select
              value={clinicaId}
              onChange={e => setClinicaId(e.target.value)}
              required={perfil === 'normal'}
            >
              <option value=''>-- Selecione uma clínica --</option>
              {clinicas.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {clinicas.length === 0 && (
              <span className='register-hint'>Nenhuma clínica disponível. Contate o administrador.</span>
            )}
          </div>

          {perfil === 'gestor' && (
            <div className='register-info'>
              ℹ️ Gestores precisam ser aprovados pelo <strong>Administrador</strong> do sistema.
            </div>
          )}
          {perfil === 'normal' && (
            <div className='register-info'>
              ℹ️ Sua conta será analisada pelo <strong>Gestor da Clínica</strong> selecionada.
            </div>
          )}

          <button type='submit' className='primary' disabled={loading}>
            {loading ? 'Registrando...' : 'Criar Conta'}
          </button>
        </form>

        {error && <p className='error-msg'>{error}</p>}

        <p style={{marginTop:'1rem', fontSize:'0.9rem', color:'#555'}}>
          Já tem conta?{' '}
          <button className='link-btn' onClick={() => navigate('/login')}>Entrar</button>
        </p>
      </div>

      {showModal && (
        <div className='modal-overlay'>
          <div className='modal-box'>
            <div className='modal-icon'>✅</div>
            <h3>Cadastro realizado!</h3>
            <p>{modalMsg}</p>
            <button className='primary modal-btn' onClick={() => { setShowModal(false); navigate('/login') }}>
              Ir para o Login
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
