import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import '../InnerPage.css'

const STATUS_CFG = {
  agendada:       { color: '#64748b', label: 'Agendada'    },
  confirmada:     { color: '#60a5fa', label: 'Confirmada'  },
  em_triagem:     { color: '#fbbf24', label: 'Em Triagem'  },
  triado:         { color: '#a78bfa', label: 'Triado'      },
  em_atendimento: { color: '#fb923c', label: 'Em Atend.'   },
  liberada:       { color: '#4ade80', label: 'Liberado'    },
}

function Badge({ status }) {
  const c = STATUS_CFG[status] || { color: '#64748b', label: status }
  return (
    <span style={{
      background: `${c.color}18`, color: c.color,
      border: `1px solid ${c.color}44`,
      padding: '2px 10px', borderRadius: '20px',
      fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>{c.label}</span>
  )
}

export default function MedicoAgenda() {
  const [consultas,  setConsultas]  = useState([])
  const [pacientes,  setPacientes]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [dataSel,    setDataSel]    = useState(new Date().toISOString().split('T')[0])
  const nav = useNavigate()

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [rc, rp] = await Promise.all([
        api.get(`/medico/agenda?data=${dataSel}`),
        api.get('/pacientes'),
      ])
      setConsultas(rc.data || [])
      setPacientes(rp.data || [])
    } finally { setLoading(false) }
  }, [dataSel])

  useEffect(() => { carregar() }, [carregar])

  const nomePaciente = id => pacientes.find(p => p.id === id)?.nome || '—'

  const hoje = new Date().toISOString().split('T')[0]
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + i)
    return d.toISOString().split('T')[0]
  })

  return (
    <PageLayout title='📅 Minha Agenda'>

      {/* Mini calendário semanal */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {diasSemana.map(d => {
          const dt = new Date(d + 'T12:00:00')
          const isHoje = d === hoje
          const isSel  = d === dataSel
          return (
            <button key={d} onClick={() => setDataSel(d)} style={{
              flex: 1, minWidth: '60px',
              background: isSel ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.02)',
              border: `2px solid ${isSel ? '#60a5fa' : isHoje ? '#60a5fa44' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '10px', padding: '10px 6px', cursor: 'pointer',
              color: isSel ? '#60a5fa' : isHoje ? '#94a3b8' : '#475569',
              fontWeight: isSel ? 700 : 500, fontFamily: 'inherit',
              textAlign: 'center', transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                {dt.toLocaleDateString('pt-BR', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{dt.getDate()}</div>
            </button>
          )
        })}
      </div>

      {/* Seletor de data livre */}
      <div className='inner-card' style={{ padding: '12px 16px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className='form-label'>Outra data:</label>
          <input type='date' className='form-input' value={dataSel} onChange={e => setDataSel(e.target.value)} style={{ width: '160px' }} />
          <button className='btn btn-secondary' style={{ marginLeft: 'auto' }} onClick={carregar}>🔄 Atualizar</button>
        </div>
      </div>

      {loading && <p className='page-loading'>⏳ Carregando agenda...</p>}

      {!loading && consultas.length === 0 && (
        <div className='page-vazio-box'>
          <span className='page-vazio-icon'>📅</span>
          <p>Nenhuma consulta para esta data.</p>
        </div>
      )}

      {!loading && consultas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {consultas.map(c => (
            <div key={c.id} style={{
              background: 'linear-gradient(145deg,#111827,#0f172a)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: `4px solid ${STATUS_CFG[c.status]?.color || '#64748b'}`,
              borderRadius: '12px', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
            }}>
              <div style={{ minWidth: '52px', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>{c.horario || '—'}</div>
                <div style={{ fontSize: '0.62rem', color: '#475569' }}>horário</div>
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.92rem' }}>{nomePaciente(c.paciente_id)}</div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px', fontStyle: 'italic' }}>{c.motivo}</div>
              </div>
              <Badge status={c.status} />
              {['triado','em_atendimento'].includes(c.status) && (
                <button className='btn btn-primary' style={{ fontSize: '0.8rem', padding: '7px 14px' }}
                  onClick={() => nav(`/medico/atendimento/${c.id}`)}>
                  {c.status === 'em_atendimento' ? '✏️ Continuar' : '🩺 Atender'}
                </button>
              )}
              {c.status === 'liberada' && (
                <button className='btn btn-secondary' style={{ fontSize: '0.8rem', padding: '7px 14px' }}
                  onClick={() => nav(`/medico/atendimento/${c.id}`)}>👁️ Ver</button>
              )}
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
