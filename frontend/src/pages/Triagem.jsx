import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import './InnerPage.css'

const PRIORIDADE_CFG = {
  normal:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  label: 'Normal',     ordem: 1 },
  prioritario:{ color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Prioritário', ordem: 2 },
  urgente:    { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',   label: 'Urgente',    ordem: 3 },
  emergencia: { color: '#f87171', bg: 'rgba(239,68,68,0.15)',    label: 'Emergência', ordem: 4 },
}

const STATUS_CFG = {
  confirmada:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Aguardando' },
  em_triagem:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: 'Em Triagem' },
  triado:      { color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   label: 'Triado'     },
}

const FORM_VAZIO = {
  peso: '', altura: '', pressao_arterial: '', temperatura: '',
  frequencia_cardiaca: '', saturacao_oxigenio: '',
  queixa_principal: '', observacoes_triagem: '', prioridade: 'normal',
}

function BadgePrioridade({ p }) {
  const cfg = PRIORIDADE_CFG[p] || PRIORIDADE_CFG.normal
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      padding: '2px 10px', borderRadius: '20px',
      fontSize: '0.7rem', fontWeight: 700
    }}>{cfg.label}</span>
  )
}

function BadgeStatus({ s }) {
  const cfg = STATUS_CFG[s] || { color: '#64748b', bg: 'transparent', label: s }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      padding: '2px 10px', borderRadius: '20px',
      fontSize: '0.7rem', fontWeight: 700
    }}>{cfg.label}</span>
  )
}

export default function Triagem() {
  const [consultas,  setConsultas]  = useState([])
  const [pacientes,  setPacientes]  = useState([])
  const [medicos,    setMedicos]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [dataSel,    setDataSel]    = useState(new Date().toISOString().split('T')[0])
  const [modalId,    setModalId]    = useState(null)
  const [form,       setForm]       = useState(FORM_VAZIO)
  const [salvando,   setSalvando]   = useState(false)
  const [dashboard,  setDashboard]  = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [tc, tp, tm, td] = await Promise.all([
        api.get(`/triagem?data=${dataSel}`),
        api.get('/pacientes'),
        api.get('/medicos'),
        api.get(`/triagem/dashboard?data=${dataSel}`),
      ])
      setConsultas(tc.data || [])
      setPacientes(tp.data || [])
      setMedicos(tm.data || [])
      setDashboard(td.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [dataSel])

  useEffect(() => { carregar() }, [carregar])

  const nomePaciente = id => pacientes.find(p => p.id === id)?.nome || '—'
  const nomeMedico   = id => medicos.find(m => m.id === id)?.nome  || '—'

  const abrirTriagem = async (consulta) => {
    if (consulta.status === 'confirmada') {
      await api.post(`/triagem/${consulta.id}/iniciar`)
    }
    setForm({
      peso:               consulta.triagem_peso         || '',
      altura:             consulta.triagem_altura        || '',
      pressao_arterial:   consulta.triagem_pressao       || '',
      temperatura:        consulta.triagem_temperatura   || '',
      frequencia_cardiaca:consulta.triagem_freq_cardiaca || '',
      saturacao_oxigenio: consulta.triagem_saturacao     || '',
      queixa_principal:   consulta.triagem_queixa        || '',
      observacoes_triagem:consulta.triagem_obs           || '',
      prioridade:         consulta.triagem_prioridade    || 'normal',
    })
    setModalId(consulta.id)
    carregar()
  }

  const fecharModal = () => { setModalId(null); setForm(FORM_VAZIO) }

  const handleForm = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const salvarTriagem = async e => {
    e.preventDefault()
    setSalvando(true)
    try {
      await api.post(`/triagem/${modalId}/finalizar`, form)
      fecharModal()
      carregar()
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message))
    } finally { setSalvando(false) }
  }

  const consultasFiltradas = filtroStatus
    ? consultas.filter(c => c.status === filtroStatus)
    : consultas

  const consultaModal = consultas.find(c => c.id === modalId)

  return (
    <PageLayout title='🩺 Triagem / Pré-atendimento'>

      {/* Dashboard */}
      {dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total do Dia',   value: dashboard.total,      color: '#60a5fa', icon: '📊' },
            { label: 'Aguardando',     value: dashboard.confirmada,  color: '#a78bfa', icon: '⏳'     },
            { label: 'Em Triagem',     value: dashboard.em_triagem,  color: '#fbbf24', icon: '🩺'     },
            { label: 'Triados',        value: dashboard.triado,      color: '#4ade80', icon: '✅'     },
            { label: 'Liberados',      value: dashboard.liberada,    color: '#94a3b8', icon: '🚪'     },
          ].map(c => (
            <div key={c.label} style={{
              background: 'linear-gradient(145deg,#111827,#0f172a)',
              border: `1px solid ${c.color}22`,
              borderTop: `3px solid ${c.color}`,
              borderRadius: '12px', padding: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{c.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Barra de controles */}
      <div className='inner-card' style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className='form-label' style={{ display: 'block', marginBottom: '5px' }}>Data</label>
            <input
              type='date' className='form-input'
              value={dataSel}
              onChange={e => setDataSel(e.target.value)}
              style={{ width: '160px' }}
            />
          </div>
          <div>
            <label className='form-label' style={{ display: 'block', marginBottom: '5px' }}>Filtrar status</label>
            <select className='form-select' value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ minWidth: '150px' }}>
              <option value=''>Todos</option>
              <option value='confirmada'>Aguardando</option>
              <option value='em_triagem'>Em Triagem</option>
              <option value='triado'>Triados</option>
            </select>
          </div>
          <button className='btn btn-secondary' style={{ marginLeft: 'auto' }} onClick={carregar}>
            🔄 Atualizar
          </button>
        </div>
      </div>

      {loading && <p className='page-loading'>⏳ Carregando fila de triagem...</p>}

      {!loading && consultasFiltradas.length === 0 && (
        <div className='page-vazio-box'>
          <span className='page-vazio-icon'>🩺</span>
          <p>Nenhuma consulta confirmada para triagem nesta data.</p>
        </div>
      )}

      {!loading && consultasFiltradas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {consultasFiltradas.map(c => (
            <div key={c.id} style={{
              background: 'linear-gradient(145deg,#111827,#0f172a)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: `4px solid ${PRIORIDADE_CFG[c.triagem_prioridade || 'normal'].color}`,
              borderRadius: '12px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
            }}>
              {/* Horário */}
              <div style={{ minWidth: '52px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>{c.horario || '—'}</div>
                <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '2px' }}>horário</div>
              </div>

              {/* Paciente */}
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>{nomePaciente(c.paciente_id)}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  {nomeMedico(c.medico_id) !== '—' ? `Dr(a). ${nomeMedico(c.medico_id)}` : 'Sem médico'}
                </div>
                {c.motivo && (
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '3px', fontStyle: 'italic' }}>
                    {c.motivo}
                  </div>
                )}
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <BadgeStatus s={c.status} />
                {c.triagem_prioridade && c.status === 'triado' && (
                  <BadgePrioridade p={c.triagem_prioridade} />
                )}
              </div>

              {/* Sinais vitais resumo (se triado) */}
              {c.status === 'triado' && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.75rem', color: '#64748b' }}>
                  {c.triagem_pressao     && <span>🩸 {c.triagem_pressao}</span>}
                  {c.triagem_temperatura && <span>🌡️ {c.triagem_temperatura}°C</span>}
                  {c.triagem_saturacao   && <span>💧 {c.triagem_saturacao}%</span>}
                  {c.triagem_freq_cardiaca && <span>❤️ {c.triagem_freq_cardiaca}bpm</span>}
                </div>
              )}

              {/* Botão */}
              <div>
                {c.status !== 'triado' && (
                  <button
                    className='btn btn-primary'
                    style={{ fontSize: '0.82rem', padding: '7px 16px' }}
                    onClick={() => abrirTriagem(c)}
                  >
                    {c.status === 'em_triagem' ? '✏️ Continuar Triagem' : '🩺 Iniciar Triagem'}
                  </button>
                )}
                {c.status === 'triado' && (
                  <button
                    className='btn btn-secondary'
                    style={{ fontSize: '0.82rem', padding: '7px 16px' }}
                    onClick={() => abrirTriagem(c)}
                  >
                    👁️ Ver / Editar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Triagem */}
      {modalId && consultaModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1.5rem',
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
            padding: '28px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  🩺 Triagem — {nomePaciente(consultaModal.paciente_id)}
                </h2>
                <p style={{ color: '#475569', fontSize: '0.8rem', margin: '4px 0 0' }}>
                  {consultaModal.horario} · Dr(a). {nomeMedico(consultaModal.medico_id)}
                </p>
              </div>
              <button onClick={fecharModal}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>
                ×
              </button>
            </div>

            <form onSubmit={salvarTriagem}>
              {/* Sinais Vitais */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
                  🩺 Sinais Vitais
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[
                    { name: 'peso',               label: 'Peso (kg)',       placeholder: '70.5'   },
                    { name: 'altura',             label: 'Altura (cm)',     placeholder: '175'    },
                    { name: 'pressao_arterial',   label: 'Pressão Arterial',placeholder: '120/80' },
                    { name: 'temperatura',        label: 'Temperatura (°C)',placeholder: '36.5'   },
                    { name: 'frequencia_cardiaca',label: 'Freq. Cardíaca',  placeholder: '72bpm'  },
                    { name: 'saturacao_oxigenio', label: 'Saturação O₂',   placeholder: '98%'    },
                  ].map(f => (
                    <div key={f.name}>
                      <label className='form-label' style={{ display: 'block', marginBottom: '5px' }}>{f.label}</label>
                      <input className='form-input' name={f.name} value={form[f.name]} onChange={handleForm}
                        placeholder={f.placeholder} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Prioridade */}
              <div style={{ marginBottom: '16px' }}>
                <label className='form-label' style={{ display: 'block', marginBottom: '8px' }}>Prioridade</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(PRIORIDADE_CFG).map(([key, cfg]) => (
                    <label key={key} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                      background: form.prioridade === key ? cfg.bg : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${form.prioridade === key ? cfg.color + '66' : 'rgba(255,255,255,0.07)'}`,
                      color: form.prioridade === key ? cfg.color : '#64748b',
                      fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s',
                    }}>
                      <input type='radio' name='prioridade' value={key}
                        checked={form.prioridade === key} onChange={handleForm}
                        style={{ display: 'none' }} />
                      {cfg.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Queixa */}
              <div style={{ marginBottom: '14px' }}>
                <label className='form-label' style={{ display: 'block', marginBottom: '5px' }}>Queixa Principal</label>
                <input className='form-input' name='queixa_principal' value={form.queixa_principal}
                  onChange={handleForm} placeholder='Descreva a queixa principal do paciente...' />
              </div>

              {/* Obs */}
              <div style={{ marginBottom: '20px' }}>
                <label className='form-label' style={{ display: 'block', marginBottom: '5px' }}>Observações da Triagem</label>
                <textarea className='form-textarea' name='observacoes_triagem' value={form.observacoes_triagem}
                  onChange={handleForm} rows={3}
                  placeholder='Observações adicionais...' />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type='submit' className='btn btn-success' disabled={salvando} style={{ flex: 1 }}>
                  {salvando ? 'Salvando...' : '✓ Finalizar Triagem'}
                </button>
                <button type='button' className='btn btn-secondary' onClick={fecharModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
