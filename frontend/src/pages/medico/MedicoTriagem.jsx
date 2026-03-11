import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import '../InnerPage.css'

const PRIO_CFG = {
  normal:      { color: '#94a3b8', label: 'Normal'      },
  prioritario: { color: '#60a5fa', label: 'Prioritário' },
  urgente:     { color: '#fb923c', label: 'Urgente'     },
  emergencia:  { color: '#f87171', label: 'Emergência'  },
}

export default function MedicoTriagem() {
  const [fila,      setFila]      = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [dataSel,   setDataSel]   = useState(new Date().toISOString().split('T')[0])
  const nav = useNavigate()

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [rf, rp] = await Promise.all([
        api.get(`/medico/triagem?data=${dataSel}`),
        api.get('/pacientes'),
      ])
      setFila(rf.data || [])
      setPacientes(rp.data || [])
    } finally { setLoading(false) }
  }, [dataSel])

  useEffect(() => { carregar() }, [carregar])

  const nomePaciente = id => pacientes.find(p => p.id === id)?.nome || '—'

  return (
    <PageLayout title='🩺 Fila de Triagem — Meus Pacientes'>

      <div className='inner-card' style={{ padding: '12px 16px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className='form-label'>Data:</label>
          <input type='date' className='form-input' value={dataSel}
            onChange={e => setDataSel(e.target.value)} style={{ width: '160px' }} />
          <button className='btn btn-secondary' style={{ marginLeft: 'auto' }} onClick={carregar}>🔄 Atualizar</button>
        </div>
      </div>

      {loading && <p className='page-loading'>⏳ Carregando fila...</p>}

      {!loading && fila.length === 0 && (
        <div className='page-vazio-box'>
          <span className='page-vazio-icon'>✅</span>
          <p>Nenhum paciente aguardando atendimento.</p>
        </div>
      )}

      {!loading && fila.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {fila.map((c, idx) => {
            const prio = PRIO_CFG[c.triagem_prioridade || 'normal']
            const isEmAtend = c.status === 'em_atendimento'
            return (
              <div key={c.id} style={{
                background: 'linear-gradient(145deg,#111827,#0f172a)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `4px solid ${prio.color}`,
                borderRadius: '12px', padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
              }}>
                {/* Posição na fila */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: `${prio.color}18`, border: `2px solid ${prio.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: 800, color: prio.color,
                }}>{idx + 1}</div>

                {/* Dados */}
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.93rem' }}>
                    {nomePaciente(c.paciente_id)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {c.horario} · {c.motivo}
                  </div>
                  {c.triagem_queixa && (
                    <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: '3px', fontStyle: 'italic' }}>
                      💬 {c.triagem_queixa}
                    </div>
                  )}
                </div>

                {/* Sinais vitais resumo */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.73rem', color: '#64748b' }}>
                  {c.triagem_pressao       && <span>🩸 {c.triagem_pressao}</span>}
                  {c.triagem_temperatura   && <span>🌡️ {c.triagem_temperatura}°C</span>}
                  {c.triagem_saturacao     && <span>💧 {c.triagem_saturacao}%</span>}
                  {c.triagem_freq_cardiaca && <span>❤️ {c.triagem_freq_cardiaca}bpm</span>}
                </div>

                {/* Prioridade badge */}
                <span style={{
                  background: `${prio.color}18`, color: prio.color,
                  border: `1px solid ${prio.color}44`,
                  padding: '3px 12px', borderRadius: '20px',
                  fontSize: '0.72rem', fontWeight: 700,
                }}>{prio.label}</span>

                {/* Botão */}
                <button
                  className={isEmAtend ? 'btn btn-warning' : 'btn btn-primary'}
                  style={{ fontSize: '0.82rem', padding: '8px 16px', whiteSpace: 'nowrap' }}
                  onClick={() => nav(`/medico/atendimento/${c.id}`)}
                >
                  {isEmAtend ? '✏️ Continuar Atend.' : '🩺 Iniciar Atendimento'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
