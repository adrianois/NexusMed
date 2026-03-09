import { useEffect, useState } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ clinicas: 0, usuarios: 0, pendentes: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/admin/clinicas'),
      api.get('/admin/usuarios')
    ]).then(([resC, resU]) => {
      const clinicas = resC.data || []
      const usuarios = resU.data || []
      setStats({
        clinicas: clinicas.length,
        clinicasAtivas: clinicas.filter(c => c.ativo).length,
        usuarios: usuarios.length,
        pendentes: usuarios.filter(u => u.status === 'pendente').length
      })
    }).catch(() => {})
  }, [])

  const cards = [
    { icon: '🏨', label: 'Total de Clínicas',   value: stats.clinicas,       color: '#38bdf8', path: '/admin/clinicas' },
    { icon: '✅', label: 'Clínicas Ativas',      value: stats.clinicasAtivas, color: '#22c55e', path: '/admin/clinicas' },
    { icon: '👥', label: 'Total de Usuários',    value: stats.usuarios,       color: '#a78bfa', path: '/admin/usuarios' },
    { icon: '⏳', label: 'Aguardando Aprovação', value: stats.pendentes,      color: '#f59e0b', path: '/admin/usuarios' },
  ]

  return (
    <PageLayout title='🛡️ Painel Administrativo'>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'20px', marginBottom:'32px' }}>
        {cards.map((c, i) => (
          <div key={i} onClick={() => navigate(c.path)}
            style={{ background:'#1e293b', border:`1px solid ${c.color}33`, borderRadius:'10px', padding:'20px', cursor:'pointer', transition:'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform='none'}
          >
            <div style={{ fontSize:'2rem', marginBottom:'8px' }}>{c.icon}</div>
            <div style={{ fontSize:'1.8rem', fontWeight:700, color: c.color }}>{c.value ?? 0}</div>
            <div style={{ fontSize:'0.82rem', color:'#94a3b8', marginTop:'4px' }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
        <div onClick={() => navigate('/admin/clinicas')} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'10px', padding:'20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'16px' }}>
          <span style={{ fontSize:'2rem' }}>🏨</span>
          <div>
            <div style={{ fontWeight:600, color:'#e2e8f0' }}>Gerenciar Clínicas</div>
            <div style={{ fontSize:'0.82rem', color:'#64748b' }}>Cadastrar, ativar e desativar clínicas</div>
          </div>
        </div>
        <div onClick={() => navigate('/admin/usuarios')} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'10px', padding:'20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'16px' }}>
          <span style={{ fontSize:'2rem' }}>👤</span>
          <div>
            <div style={{ fontWeight:600, color:'#e2e8f0' }}>Gerenciar Usuários</div>
            <div style={{ fontSize:'0.82rem', color:'#64748b' }}>Aprovar usuários e vincular a clínicas</div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
