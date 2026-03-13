import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { generateTriagemPDF } from '../utils/generateTriagemPDF'
import { generateTriagemListaPDF } from '../utils/generateTriagemListaPDF'
import './InnerPage.css'

const PRIORIDADE_CFG = {
  normal:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  label: 'Normal',      ordem: 1 },
  prioritario: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Prioritário', ordem: 2 },
  urgente:     { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'Urgente',     ordem: 3 },
  emergencia:  { color: '#f87171', bg: 'rgba(239,68,68,0.15)',   label: 'Emergência',  ordem: 4 },
}

const STATUS_CFG = {
  confirmada: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Aguardando' },
  em_triagem: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: 'Em Triagem' },
  triado:     { color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   label: 'Triado'     },
}

const FORM_VAZIO = {
  peso: '', altura: '', pressao_arterial: '', temperatura: '',
  frequencia_cardiaca: '', saturacao_oxigenio: '',
  queixa_principal: '', observacoes_triagem: '', prioridade: 'normal',
}

const SINAIS = [
  { name: 'peso',                label: 'Peso (kg)',        placeholder: '70.5',   icon: '⚖️'  },
  { name: 'altura',              label: 'Altura (cm)',      placeholder: '175',    icon: '📏'  },
  { name: 'pressao_arterial',    label: 'Pressão Arterial', placeholder: '120/80', icon: '🩸'  },
  { name: 'temperatura',         label: 'Temperatura (°C)', placeholder: '36.5',   icon: '🌡️' },
  { name: 'frequencia_cardiaca', label: 'Freq. Cardíaca',   placeholder: '72 bpm', icon: '❤️' },
  { name: 'saturacao_oxigenio',  label: 'Saturação O₂',    placeholder: '98 %',   icon: '💧'  },
]

const btnPdfStyle = (gerando) => ({
  background: 'rgba(33,128,141,0.15)',
  border: '1px solid rgba(33,128,141,0.5)',
  borderRadius: '8px',
  color: '#2dd4bf',
  fontSize: '0.82rem',
  fontWeight: 700,
  padding: '7px 14px',
  whiteSpace: 'nowrap',
  cursor: gerando ? 'not-allowed' : 'pointer',
  opacity: gerando ? 0.6 : 1,
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  transition: 'all 0.2s',
})

function Badge({ color, bg, label }) {
  return (
    <span style={{
      background: bg, color,
      border: `1px solid ${color}44`,
      padding: '2px 10px', borderRadius: '20px',
      fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function ToastSucesso({ mensagem, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      background: 'linear-gradient(135deg, #14532d, #166534)',
      border: '1px solid #22c55e55',
      borderLeft: '4px solid #4ade80',
      borderRadius: '12px', padding: '14px 20px',
      color: '#bbf7d0', fontSize: '0.9rem', fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span style={{ fontSize: '1.2rem' }}>✅</span>
      {mensagem}
    </div>
  )
}

export default function Triagem() {
  const [consultas,    setConsultas]    = useState([])
  const [pacientes,    setPacientes]    = useState([])
  const [medicos,      setMedicos]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [dataSel,      setDataSel]      = useState(new Date().toISOString().split('T')[0])
  const [modalId,      setModalId]      = useState(null)
  const [form,         setForm]         = useState(FORM_VAZIO)
  const [salvando,     setSalvando]     = useState(false)
  const [dashboard,    setDashboard]    = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [gerando,      setGerando]      = useState(false)
  const [gerandoLista, setGerandoLista] = useState(false)
  const [toast,        setToast]        = useState(null)

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
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [dataSel])

  useEffect(() => { carregar() }, [carregar])

  const nomePaciente  = id => pacientes.find(p => p.id === id)?.nome || '—'
  const nomeMedico    = id => medicos.find(m => m.id === id)?.nome  || '—'
  const obterPaciente = id => pacientes.find(p => p.id === id)
  const obterMedico   = id => medicos.find(m => m.id === id)

  const abrirTriagem = async (consulta) => {
    if (consulta.status === 'confirmada') {
      await api.post(`/triagem/${consulta.id}/iniciar`).catch(() => {})
    }
    setForm({
      peso:                consulta.triagem_peso          || '',
      altura:              consulta.triagem_altura         || '',
      pressao_arterial:    consulta.triagem_pressao        || '',
      temperatura:         consulta.triagem_temperatura    || '',
      frequencia_cardiaca: consulta.triagem_freq_cardiaca  || '',
      saturacao_oxigenio:  consulta.triagem_saturacao      || '',
      queixa_principal:    consulta.triagem_queixa         || '',
      observacoes_triagem: consulta.triagem_obs            || '',
      prioridade:          consulta.triagem_prioridade     || 'normal',
    })
    setModalId(consulta.id)
    carregar()
  }

  const gerarPDF = (consulta, fecharDepois = false) => {
    try {
      setGerando(true)
      const paciente = obterPaciente(consulta.paciente_id)
      const medico   = obterMedico(consulta.medico_id)
      generateTriagemPDF(consulta, paciente, medico)
      setToast(`PDF de ${paciente?.nome || 'paciente'} gerado com sucesso!`)
      if (fecharDepois) fecharModal()
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
      alert('Erro ao gerar PDF: ' + err.message)
    } finally {
      setGerando(false)
    }
  }

  const gerarListaPDF = () => {
    try {
      setGerandoLista(true)
      generateTriagemListaPDF(consultasFiltradas, pacientes, medicos, dataSel, filtroStatus)
      const total = consultasFiltradas.length
      setToast(`Relatório com ${total} registro(s) gerado com sucesso!`)
    } catch (err) {
      console.error('Erro ao gerar PDF da lista:', err)
      alert('Erro ao gerar PDF: ' + err.message)
    } finally {
      setGerandoLista(false)
    }
  }

  const fecharModal = () => { setModalId(null); setForm(FORM_VAZIO) }
  const handleForm  = e  => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

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

  const sectionTitle = (label) => (
    <div style={{
      fontSize: '0.68rem', fontWeight: 700, color: '#60a5fa',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: '12px', paddingBottom: '8px',
      borderBottom: '1px solid rgba(96,165,250,0.15)',
    }}>{label}</div>
  )

  return (
    <PageLayout title='🩺 Triagem / Pré-atendimento'>

      {toast && <ToastSucesso mensagem={toast} onClose={() => setToast(null)} />}

      {/* Cards resumo */}
      {dashboard && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))',
          gap: '12px', marginBottom: '24px',
        }}>
          {[
            { label: 'Total do Dia', value: dashboard.total,     color: '#60a5fa', icon: '📊' },
            { label: 'Aguardando',   value: dashboard.confirmada, color: '#a78bfa', icon: '⏳' },
            { label: 'Em Triagem',   value: dashboard.em_triagem, color: '#fbbf24', icon: '🩺' },
            { label: 'Triados',      value: dashboard.triado,     color: '#4ade80', icon: '✅' },
            { label: 'Liberados',    value: dashboard.liberada,   color: '#94a3b8', icon: '🚪' },
          ].map(c => (
            <div key={c.label} style={{
              background: 'linear-gradient(145deg,#111827,#0f172a)',
              border: `1px solid ${c.color}22`,
              borderTop: `3px solid ${c.color}`,
              borderRadius: '12px', padding: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{c.icon}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controles */}
      <div className='inner-card' style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className='form-label' style={{ display: 'block', marginBottom: '5px' }}>Data</label>
            <input type='date' className='form-input' value={dataSel}
              onChange={e => setDataSel(e.target.value)} style={{ width: '160px' }} />
          </div>
          <div>
            <label className='form-label' style={{ display: 'block', marginBottom: '5px' }}>Status</label>
            <select className='form-select' value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)} style={{ minWidth: '150px' }}>
              <option value=''>Todos</option>
              <option value='confirmada'>Aguardando</option>
              <option value='em_triagem'>Em Triagem</option>
              <option value='triado'>Triados</option>
            </select>
          </div>

          {/* Botões da barra de controles */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>

            {/* Botão Exportar Lista PDF */}
            <button
              onClick={gerarListaPDF}
              disabled={gerandoLista || consultasFiltradas.length === 0}
              title={consultasFiltradas.length === 0 ? 'Nenhum registro para exportar' : `Exportar ${consultasFiltradas.length} registro(s) em PDF`}
              style={{
                background: consultasFiltradas.length === 0 ? 'rgba(30,41,59,0.4)' : 'rgba(99,102,241,0.15)',
                border: `1px solid ${consultasFiltradas.length === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.45)'}`,
                borderRadius: '8px',
                color: consultasFiltradas.length === 0 ? '#475569' : '#a5b4fc',
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '8px 16px',
                whiteSpace: 'nowrap',
                cursor: (gerandoLista || consultasFiltradas.length === 0) ? 'not-allowed' : 'pointer',
                opacity: gerandoLista ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              📋 {gerandoLista ? 'Gerando...' : `Exportar Lista${consultasFiltradas.length > 0 ? ` (${consultasFiltradas.length})` : ''}`}
            </button>

            <button className='btn btn-secondary' onClick={carregar}>
              🔄 Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Fila */}
      {loading && <p className='page-loading'>⏳ Carregando fila de triagem...</p>}

      {!loading && consultasFiltradas.length === 0 && (
        <div className='page-vazio-box'>
          <span className='page-vazio-icon'>🩺</span>
          <p>Nenhuma consulta confirmada para triagem nesta data.</p>
        </div>
      )}

      {!loading && consultasFiltradas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {consultasFiltradas.map(c => {
            const prioCfg = PRIORIDADE_CFG[c.triagem_prioridade || 'normal']
            return (
              <div key={c.id} style={{
                background: 'linear-gradient(145deg,#111827,#0f172a)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `4px solid ${prioCfg.color}`,
                borderRadius: '12px', padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
              }}>

                <div style={{ minWidth: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>{c.horario || '—'}</div>
                  <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: '2px' }}>horário</div>
                </div>

                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.93rem' }}>{nomePaciente(c.paciente_id)}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                    {nomeMedico(c.medico_id) !== '—' ? `Dr(a). ${nomeMedico(c.medico_id)}` : 'Sem médico'}
                  </div>
                  {c.motivo && (
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '3px', fontStyle: 'italic' }}>
                      {c.motivo}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge {...STATUS_CFG[c.status] || { color: '#64748b', bg: 'transparent', label: c.status }} />
                  {c.status === 'triado' && c.triagem_prioridade && (
                    <Badge {...prioCfg} />
                  )}
                </div>

                {c.status === 'triado' && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.74rem', color: '#64748b' }}>
                    {c.triagem_pressao       && <span>🩸 {c.triagem_pressao}</span>}
                    {c.triagem_temperatura   && <span>🌡️ {c.triagem_temperatura}°C</span>}
                    {c.triagem_saturacao     && <span>💧 {c.triagem_saturacao}%</span>}
                    {c.triagem_freq_cardiaca && <span>❤️ {c.triagem_freq_cardiaca}bpm</span>}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    style={btnPdfStyle(gerando)}
                    onClick={() => gerarPDF(c)}
                    disabled={gerando}
                    title='Gerar PDF individual da triagem'
                  >
                    📄 {gerando ? 'Gerando...' : 'Gerar PDF'}
                  </button>

                  <button
                    className={c.status === 'triado' ? 'btn btn-secondary' : 'btn btn-primary'}
                    style={{ fontSize: '0.82rem', padding: '7px 16px', whiteSpace: 'nowrap' }}
                    onClick={() => abrirTriagem(c)}
                  >
                    {c.status === 'triado'
                      ? '👁️ Ver / Editar'
                      : c.status === 'em_triagem'
                        ? '✏️ Continuar'
                        : '🩺 Iniciar Triagem'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Triagem */}
      {modalId && consultaModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem',
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '20px',
            padding: '28px 32px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 32px 64px rgba(0,0,0,0.7)',
          }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: '#f1f5f9', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  🩺 Triagem — {nomePaciente(consultaModal.paciente_id)}
                </h2>
                <p style={{ color: '#475569', fontSize: '0.82rem', margin: '5px 0 0' }}>
                  {consultaModal.horario} · Dr(a). {nomeMedico(consultaModal.medico_id)}
                </p>
                {consultaModal.motivo && (
                  <p style={{ color: '#334155', fontSize: '0.78rem', margin: '3px 0 0', fontStyle: 'italic' }}>
                    {consultaModal.motivo}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <button
                  style={{ ...btnPdfStyle(gerando), fontSize: '0.9rem', padding: '8px 16px' }}
                  onClick={() => gerarPDF(consultaModal, false)}
                  disabled={gerando}
                  title='Gerar PDF da triagem'
                >
                  📄 {gerando ? 'Gerando...' : 'Gerar PDF'}
                </button>
                <button onClick={fecharModal} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px', color: '#64748b',
                  fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1,
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
              </div>
            </div>

            <form onSubmit={salvarTriagem}>
              <div style={{ marginBottom: '22px' }}>
                {sectionTitle('🩺 Sinais Vitais')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {SINAIS.map(f => (
                    <div key={f.name}>
                      <label style={{
                        display: 'block', marginBottom: '5px',
                        fontSize: '0.75rem', fontWeight: 600,
                        color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {f.icon} {f.label}
                      </label>
                      <input
                        className='form-input'
                        name={f.name}
                        value={form[f.name]}
                        onChange={handleForm}
                        placeholder={f.placeholder}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                {sectionTitle('🚦 Classificação de Risco')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {Object.entries(PRIORIDADE_CFG).map(([key, cfg]) => (
                    <label key={key} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: '4px', padding: '10px 8px', borderRadius: '10px',
                      cursor: 'pointer',
                      background: form.prioridade === key ? cfg.bg : 'rgba(255,255,255,0.02)',
                      border: `2px solid ${form.prioridade === key ? cfg.color : 'rgba(255,255,255,0.06)'}`,
                      color: form.prioridade === key ? cfg.color : '#475569',
                      fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.15s',
                      textAlign: 'center',
                    }}>
                      <input type='radio' name='prioridade' value={key}
                        checked={form.prioridade === key} onChange={handleForm}
                        style={{ display: 'none' }} />
                      {cfg.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                {sectionTitle('💬 Queixa e Observações')}
                <input
                  className='form-input'
                  name='queixa_principal'
                  value={form.queixa_principal}
                  onChange={handleForm}
                  placeholder='Descreva a queixa principal do paciente...'
                  style={{ marginBottom: '12px', width: '100%', boxSizing: 'border-box' }}
                />
                <textarea
                  className='form-textarea'
                  name='observacoes_triagem'
                  value={form.observacoes_triagem}
                  onChange={handleForm}
                  rows={3}
                  placeholder='Observações adicionais da triagem...'
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button
                  type='submit'
                  className='btn btn-success'
                  disabled={salvando}
                  style={{ flex: 1, padding: '12px', fontSize: '0.92rem', fontWeight: 700 }}
                >
                  {salvando ? '⏳ Salvando...' : '✓ Finalizar Triagem'}
                </button>
                <button
                  type='button'
                  className='btn btn-secondary'
                  onClick={fecharModal}
                  style={{ padding: '12px 20px' }}
                >
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
