import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NaoAutorizado() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const home = user?.perfil === 'admin' ? '/admin' : user?.perfil === 'gestor' ? '/gestor' : '/dashboard'
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0f172a', flexDirection:'column', gap:'16px', color:'#e2e8f0' }}>
      <span style={{ fontSize:'4rem' }}>🚫</span>
      <h2 style={{ color:'#ef4444' }}>Acesso Não Autorizado</h2>
      <p style={{ color:'#94a3b8' }}>Você não tem permissão para acessar esta página.</p>
      <div style={{ display:'flex', gap:'12px' }}>
        <button onClick={() => navigate(home)} style={{ background:'#38bdf8', color:'#0f172a', border:'none', padding:'10px 20px', borderRadius:'6px', cursor:'pointer', fontWeight:600 }}>Ir para Home</button>
        <button onClick={logout} style={{ background:'#334155', color:'#e2e8f0', border:'none', padding:'10px 20px', borderRadius:'6px', cursor:'pointer' }}>Sair</button>
      </div>
    </div>
  )
}
