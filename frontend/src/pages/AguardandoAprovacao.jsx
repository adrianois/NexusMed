import { useAuth } from '../context/AuthContext'
import '../pages/Login.css'

export default function AguardandoAprovacao() {
  const { logout } = useAuth()
  return (
    <div className='login-container'>
      <div className='login-card' style={{ textAlign: 'center', maxWidth: '440px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
        <h2 style={{ color: '#f59e0b', marginBottom: '12px' }}>Aguardando Aprovação</h2>
        <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
          Seu cadastro foi realizado com sucesso!<br />
          Um <strong style={{ color: '#e2e8f0' }}>administrador</strong> ou <strong style={{ color: '#e2e8f0' }}>gestor</strong> precisa aprovar
          sua conta antes que você possa acessar o sistema.
        </p>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>
          Entre em contato com o responsável pela clínica para acelerar o processo.
        </p>
        <button className='login-btn' onClick={logout} style={{ background: '#334155' }}>Voltar ao Login</button>
      </div>
    </div>
  )
}
