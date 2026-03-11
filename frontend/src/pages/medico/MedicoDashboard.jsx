import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import '../InnerPage.css'

const STATUS_CFG = {
  confirmada:     { color: '#60a5fa', label: 'Aguardando' },
  triado:         { color: '#a78bfa', label: 'Triado'     },
  em_atendimento: { color: '#fbbf24', label: 'Em Atend.'  },
  liberada:       { color: '#4ade80', label: 'Liberado'   },
}

export default function MedicoDashboard() {
  const [dados,   setDados]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [pacientes, setPacientes] = useState([])
  const nav = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/medico/dashboard'),
      api.get('/pacientes'),
    ]).then(([rd, rp]) => {
      setDados(rd.data)
      setPacientes(rp.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const nomePaciente = id => pacientes.find(p => p.id === id)?.nome || '—'

  const cards = dados ? [
    { label: 'Hoje',        value: dados.total_hoje,   color: '#60a5fa', icon: '📅' },
    { label: 'Este Mês',    value: dados.total_mes,    color: '#a78bfa', icon: '📊' },
    { label: 'Aguardando',  value: dados.aguardando,   color: '#fbbf24', icon: '⏳' },
    { label: 'Em Andamento',value: dados.em_andamento, color: '#fb923c', icon: '🩺' },
    { label: 'Finalizados', value: dados.finalizados,  color: '#4ade80', icon: '✅' },
  ] : []

  return (
    <PageLayout title='🩺 Meu Painel'>
      {loading && <p className='page-loading'>⏳ Carregando...</p>}

      {!loading && dados && (
        <>
          {/* Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '12px', marginBottom: '28px' }}>
            {cards.map(c => (
              <div key={c.label} style={{
                background: 'linear-gradient(145deg,#111827,#0f172a)',
                border: `1px solid ${c.color}22`, borderTop: `3px solid ${c.color}`,
                borderRadius: '12px', padding: '18px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{c.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Próximos pacientes do dia */}
          <div style={{
            background: 'linear-gradient(145deg,#111827,#0f172a)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', padding: '22px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid rgba(96,165,250,0.15)' }}>
              📋 Próximos Pacientes — Hoje
            </div>
            {dados.proximas.length === 0 && (
              <p style={{ color: '#475569', fontSize: '0.88rem', textAlign: 'center', padding: '16px 0' }}>Nenhum paciente agendado para hoje.</p>
            )}
            {dados.proximas.map(c => {
              const scfg = STATUS_CFG[c.status] || STATUS_CFG.confirmada
              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ minWidth: '48px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9' }}>{c.horario || '—'}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.92rem' }}>{nomePaciente(c.paciente_id)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>{c.motivo}</div>
                  </div>
                  <span style={{
                    background: `${scfg.color}18`, color: scfg.color,
                    border: `1px solid ${scfg.color}44`,
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>{scfg.label}</span>
                  {c.status === 'triado' && (
                    <button className='btn btn-primary' style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                      onClick={() => nav(`/medico/atendimento/${c.id}`)}>
                      🩺 Atender
                    </button>
                  )}
                </div>
              )
            })}
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <button className='btn btn-secondary' style={{ fontSize: '0.84rem' }} onClick={() => nav('/medico/agenda')}>📅 Ver Agenda</button>
              <button className='btn btn-secondary' style={{ fontSize: '0.84rem' }} onClick={() => nav('/medico/triagem')}>🩺 Fila de Triagem</button>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  )
}
