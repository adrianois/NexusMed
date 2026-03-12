import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'

// Remove prefixos "Dr", "Dr.", "Dra", "Dra." do início do nome
function primeiroNome(nomeCompleto) {
  if (!nomeCompleto) return ''
  const semPrefixo = nomeCompleto.replace(/^(Dr\.?a?\.?\s*)/i, '').trim()
  return semPrefixo.split(' ')[0] || nomeCompleto.split(' ')[0]
}

export default function MedicoDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ consultas: 0, hoje: 0, pendentes: 0, pacientes: 0 })

  useEffect(() => {
    Promise.all([api.get('/consultas'), api.get('/pacientes')]).then(([rc, rp]) => {
      const consultas  = rc.data || []
      const hoje       = new Date().toISOString().slice(0,10)
      const hojeCount  = consultas.filter(c => c.data_consulta === hoje).length
      const pendentes  = consultas.filter(c => ['agendada','confirmada'].includes(c.status)).length
      setStats({ consultas: consultas.length, hoje: hojeCount, pendentes, pacientes: (rp.data||[]).length })
    }).catch(() => {})
  }, [])

  const card = (to, icon, titulo, valor, cor, desc) => (
    <Link to={to} style={{ textDecoration:'none' }}>
      <div style={{ background:'#1e293b', border:`1px solid ${cor}33`, borderRadius:'14px',
        padding:'24px', cursor:'pointer', transition:'border-color 0.2s',
        ':hover': { borderColor: cor } }}>
        <div style={{ fontSize:'2rem', marginBottom:'8px' }}>{icon}</div>
        <div style={{ color: cor, fontSize:'1.8rem', fontWeight:800 }}>{valor}</div>
        <div style={{ color:'#e2e8f0', fontWeight:600, marginTop:'4px' }}>{titulo}</div>
        <div style={{ color:'#64748b', fontSize:'0.8rem', marginTop:'4px' }}>{desc}</div>
      </div>
    </Link>
  )

  const atalho = (to, icon, label, cor) => (
    <Link to={to} style={{ textDecoration:'none' }}>
      <div style={{ background:'#1e293b', border:`1px solid ${cor}33`, borderRadius:'12px',
        padding:'16px 20px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer' }}>
        <span style={{ fontSize:'1.5rem' }}>{icon}</span>
        <span style={{ color:'#e2e8f0', fontWeight:600, fontSize:'0.95rem' }}>{label}</span>
      </div>
    </Link>
  )

  return (
    <PageLayout title={`👨‍⚕️ Olá, Dr(a). ${primeiroNome(user?.nome)}`}>

      {/* Cards de estatísticas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'16px', marginBottom:'32px' }}>
        {card('/medico/agenda',   '🗓️', 'Consultas Hoje',  stats.hoje,      '#60a5fa', 'Agendadas para hoje')}
        {card('/medico/agenda',   '⏳',   'Pendentes',      stats.pendentes, '#fbbf24', 'Agendadas + Confirmadas')}
        {card('/medico/historico','📂', 'Total Consultas',stats.consultas,  '#4ade80', 'Todas as consultas')}
        {card('/medico/historico','👥', 'Pacientes',      stats.pacientes, '#a78bfa', 'Total de pacientes')}
      </div>

      {/* Atalhos rápidos */}
      <h3 style={{ color:'#94a3b8', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px' }}>
        Acesso Rápido
      </h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px' }}>
        {atalho('/medico/agenda',    '🗓️', 'Minha Agenda',          '#60a5fa')}
        {atalho('/medico/triagem',   '🩺', 'Triagem',                '#fbbf24')}
        {atalho('/medico/evolucao',  '📊', 'Evolução do Paciente', '#6366f1')}
        {atalho('/medico/historico', '📂', 'Histórico Clínico',    '#4ade80')}
        {atalho('/medico/documentos','📜', 'Documentos',            '#a78bfa')}
      </div>
    </PageLayout>
  )
}
