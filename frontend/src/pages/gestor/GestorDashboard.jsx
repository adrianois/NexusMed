import { useEffect, useState } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function GestorDashboard() {
  const { user } = useAuth()
  const [pendentes, setPendentes] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/gestor/usuarios/pendentes').then(r => setPendentes(r.data || [])).catch(() => {})
  }, [])

  return (
    <PageLayout title='📊 Painel do Gestor'>
      <div style={{ marginBottom:'24px', padding:'16px 20px', background:'#1e293b', borderRadius:'8px', border:'1px solid #334155' }}>
        <p style={{ color:'#94a3b8', margin:0 }}>Bem-vindo, <strong style={{ color:'#e2e8f0' }}>{user?.nome}</strong>! Você é gestor desta clínica.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'20px', marginBottom:'32px' }}>
        <div onClick={() => navigate('/gestor/usuarios')}
          style={{ background:'#1e293b', border:'1px solid #f59e0b33', borderRadius:'10px', padding:'20px', cursor:'pointer' }}>
          <div style={{ fontSize:'2rem', marginBottom:'8px' }}>⏳</div>
          <div style={{ fontSize:'1.8rem', fontWeight:700, color:'#f59e0b' }}>{pendentes.length}</div>
          <div style={{ fontSize:'0.82rem', color:'#94a3b8', marginTop:'4px' }}>Usuários Pendentes</div>
        </div>
        <div onClick={() => navigate('/pacientes')}
          style={{ background:'#1e293b', border:'1px solid #38bdf833', borderRadius:'10px', padding:'20px', cursor:'pointer' }}>
          <div style={{ fontSize:'2rem', marginBottom:'8px' }}>👥</div>
          <div style={{ fontSize:'0.9rem', color:'#38bdf8', fontWeight:600, marginTop:'8px' }}>Gerenciar Pacientes</div>
        </div>
        <div onClick={() => navigate('/consultas')}
          style={{ background:'#1e293b', border:'1px solid #22c55e33', borderRadius:'10px', padding:'20px', cursor:'pointer' }}>
          <div style={{ fontSize:'2rem', marginBottom:'8px' }}>📅</div>
          <div style={{ fontSize:'0.9rem', color:'#22c55e', fontWeight:600, marginTop:'8px' }}>Consultas</div>
        </div>
      </div>

      {pendentes.length > 0 && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>⚠️ Usuários aguardando aprovação</h3>
          <p style={{ color:'#94a3b8', marginBottom:'16px', fontSize:'0.88rem' }}>Os usuários abaixo se registraram e precisam de aprovação para acessar o sistema.</p>
          <button className='btn btn-primary' onClick={() => navigate('/gestor/usuarios')}>Ver e Aprovar Usuários →</button>
        </div>
      )}
    </PageLayout>
  )
}
