import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'https://nexusmed-backend.onrender.com'

const etapas = ['Clínica', 'Médico', 'Data & Horário', 'Seus Dados', 'Confirmação']

export default function AgendamentoPublico() {
  const [etapa, setEtapa]           = useState(0)
  const [clinicas, setClinicas]     = useState([])
  const [medicos, setMedicos]       = useState([])
  const [horarios, setHorarios]     = useState([])
  const [carregando, setCarregando] = useState(false)
  const [enviado, setEnviado]       = useState(false)
  const [erro, setErro]             = useState('')

  const [form, setForm] = useState({
    clinica_id: '', clinica_nome: '',
    medico_id:  '', medico_nome: '', medico_especialidade: '',
    data_consulta: '', horario: '',
    nome_paciente: '', telefone: '', email: '', motivo: ''
  })

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  // Carrega clínicas
  useEffect(() => {
    axios.get(`${API}/agendamento-publico/clinicas`)
      .then(r => setClinicas(r.data))
      .catch(() => setErro('Erro ao carregar clínicas.'))
  }, [])

  // Carrega médicos ao selecionar clínica
  useEffect(() => {
    if (!form.clinica_id) return
    setMedicos([]); set('medico_id', ''); set('medico_nome', '')
    axios.get(`${API}/agendamento-publico/medicos?clinica_id=${form.clinica_id}`)
      .then(r => setMedicos(r.data))
  }, [form.clinica_id])

  // Carrega horários ao selecionar médico + data
  useEffect(() => {
    if (!form.medico_id || !form.data_consulta) return
    setHorarios([]); set('horario', '')
    axios.get(`${API}/agendamento-publico/horarios?medico_id=${form.medico_id}&data=${form.data_consulta}`)
      .then(r => setHorarios(r.data))
  }, [form.medico_id, form.data_consulta])

  const dataMin = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const avancar = () => { setErro(''); setEtapa(e => e + 1) }
  const voltar  = () => { setErro(''); setEtapa(e => e - 1) }

  const validarEtapa = () => {
    if (etapa === 0 && !form.clinica_id)    return setErro('Selecione uma clínica.')
    if (etapa === 1 && !form.medico_id)     return setErro('Selecione um médico.')
    if (etapa === 2 && !form.data_consulta) return setErro('Selecione uma data.')
    if (etapa === 2 && !form.horario)       return setErro('Selecione um horário.')
    if (etapa === 3 && !form.nome_paciente) return setErro('Informe seu nome.')
    if (etapa === 3 && !form.motivo)        return setErro('Informe o motivo da consulta.')
    if (etapa === 3 && form.telefone && !/^\d{10,11}$/.test(form.telefone.replace(/\D/g,'')))
      return setErro('Telefone inválido.')
    avancar()
  }

  const confirmar = async () => {
    setCarregando(true); setErro('')
    try {
      await axios.post(`${API}/agendamento-publico/agendar`, {
        clinica_id:    form.clinica_id,
        medico_id:     form.medico_id,
        data_consulta: form.data_consulta,
        horario:       form.horario,
        motivo:        form.motivo,
        nome_paciente: form.nome_paciente,
        telefone:      form.telefone.replace(/\D/g,''),
        email:         form.email,
      })
      setEnviado(true)
    } catch (e) {
      setErro(e.response?.data?.error || 'Erro ao agendar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const formatarData = (iso) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  if (enviado) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.successIcon}>✅</div>
        <h2 style={s.successTitle}>Agendamento Realizado!</h2>
        <p style={s.successText}>Sua consulta foi agendada com sucesso.</p>
        <div style={s.resumo}>
          <div style={s.resumoLinha}><span style={s.resumoLabel}>Clínica</span><span>{form.clinica_nome}</span></div>
          <div style={s.resumoLinha}><span style={s.resumoLabel}>Médico</span><span>{form.medico_nome}</span></div>
          <div style={s.resumoLinha}><span style={s.resumoLabel}>Data</span><span>{formatarData(form.data_consulta)}</span></div>
          <div style={s.resumoLinha}><span style={s.resumoLabel}>Horário</span><span>{form.horario}</span></div>
          <div style={s.resumoLinha}><span style={s.resumoLabel}>Motivo</span><span>{form.motivo}</span></div>
        </div>
        <p style={s.successObs}>📞 A clínica entrará em contato para confirmar seu agendamento.</p>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <span style={s.logo}>🏥</span>
          <div>
            <h1 style={s.titulo}>Agendar Consulta</h1>
            <p style={s.subtitulo}>Sem precisar criar conta</p>
          </div>
        </div>

        {/* Stepper */}
        <div style={s.stepper}>
          {etapas.map((nome, i) => (
            <div key={i} style={s.stepItem}>
              <div style={{ ...s.stepCircle, ...(i <= etapa ? s.stepAtivo : {}) }}>
                {i < etapa ? '✓' : i + 1}
              </div>
              <span style={{ ...s.stepLabel, ...(i === etapa ? s.stepLabelAtivo : {}) }}>{nome}</span>
            </div>
          ))}
        </div>

        {/* Erro */}
        {erro && <div style={s.erroBox}>{erro}</div>}

        {/* ── Etapa 0: Clínica ── */}
        {etapa === 0 && (
          <div style={s.etapaBox}>
            <h3 style={s.etapaTitulo}>Selecione a Clínica</h3>
            <div style={s.grid2}>
              {clinicas.map(c => (
                <button
                  key={c.id}
                  style={{ ...s.opcaoBtn, ...(form.clinica_id === c.id ? s.opcaoBtnAtivo : {}) }}
                  onClick={() => { set('clinica_id', c.id); set('clinica_nome', c.nome) }}
                >
                  <span style={s.opcaoIcon}>🏨</span>
                  <span style={s.opcaoNome}>{c.nome}</span>
                  {c.cidade && <span style={s.opcaoSub}>{c.cidade}{c.uf ? ` - ${c.uf}` : ''}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Etapa 1: Médico ── */}
        {etapa === 1 && (
          <div style={s.etapaBox}>
            <h3 style={s.etapaTitulo}>Selecione o Médico</h3>
            {medicos.length === 0
              ? <p style={s.vazio}>Nenhum médico disponível nesta clínica.</p>
              : <div style={s.grid2}>
                  {medicos.map(m => (
                    <button
                      key={m.id}
                      style={{ ...s.opcaoBtn, ...(form.medico_id === m.id ? s.opcaoBtnAtivo : {}) }}
                      onClick={() => { set('medico_id', m.id); set('medico_nome', m.nome); set('medico_especialidade', m.especialidade || '') }}
                    >
                      <span style={s.opcaoIcon}>👨‍⚕️</span>
                      <span style={s.opcaoNome}>{m.nome}</span>
                      {m.especialidade && <span style={s.opcaoSub}>{m.especialidade}</span>}
                    </button>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── Etapa 2: Data & Horário ── */}
        {etapa === 2 && (
          <div style={s.etapaBox}>
            <h3 style={s.etapaTitulo}>Data da Consulta</h3>
            <input
              type='date'
              min={dataMin()}
              value={form.data_consulta}
              onChange={e => set('data_consulta', e.target.value)}
              style={s.input}
            />

            {form.data_consulta && (
              <>
                <h3 style={{ ...s.etapaTitulo, marginTop: 24 }}>Horário Disponível</h3>
                {horarios.length === 0
                  ? <p style={s.vazio}>Carregando horários...</p>
                  : <div style={s.gridHorarios}>
                      {horarios.map(h => (
                        <button
                          key={h.horario}
                          disabled={!h.disponivel}
                          style={{
                            ...s.horarioBtn,
                            ...(form.horario === h.horario ? s.horarioBtnAtivo : {}),
                            ...(!h.disponivel ? s.horarioBtnOcupado : {})
                          }}
                          onClick={() => h.disponivel && set('horario', h.horario)}
                        >
                          {h.horario}
                          {!h.disponivel && <span style={s.ocupadoTag}>ocupado</span>}
                        </button>
                      ))}
                    </div>
                }
              </>
            )}
          </div>
        )}

        {/* ── Etapa 3: Dados do Paciente ── */}
        {etapa === 3 && (
          <div style={s.etapaBox}>
            <h3 style={s.etapaTitulo}>Seus Dados</h3>
            <div style={s.formGrid}>
              <div style={s.formField}>
                <label style={s.label}>Nome completo <span style={s.req}>*</span></label>
                <input placeholder='Seu nome' value={form.nome_paciente}
                  onChange={e => set('nome_paciente', e.target.value)} style={s.input} />
              </div>
              <div style={s.formField}>
                <label style={s.label}>Telefone / WhatsApp</label>
                <input placeholder='(67) 99999-9999' value={form.telefone}
                  onChange={e => set('telefone', e.target.value)} style={s.input} />
              </div>
              <div style={{ ...s.formField, gridColumn: '1 / -1' }}>
                <label style={s.label}>E-mail</label>
                <input placeholder='seu@email.com' type='email' value={form.email}
                  onChange={e => set('email', e.target.value)} style={s.input} />
              </div>
              <div style={{ ...s.formField, gridColumn: '1 / -1' }}>
                <label style={s.label}>Motivo da consulta <span style={s.req}>*</span></label>
                <textarea placeholder='Descreva brevemente o motivo da sua consulta...'
                  value={form.motivo} rows={3}
                  onChange={e => set('motivo', e.target.value)} style={{ ...s.input, resize: 'vertical' }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Etapa 4: Confirmação ── */}
        {etapa === 4 && (
          <div style={s.etapaBox}>
            <h3 style={s.etapaTitulo}>Confirme seu Agendamento</h3>
            <div style={s.resumo}>
              <div style={s.resumoLinha}><span style={s.resumoLabel}>Clínica</span><span>{form.clinica_nome}</span></div>
              <div style={s.resumoLinha}><span style={s.resumoLabel}>Médico</span><span>{form.medico_nome}</span></div>
              {form.medico_especialidade && <div style={s.resumoLinha}><span style={s.resumoLabel}>Especialidade</span><span>{form.medico_especialidade}</span></div>}
              <div style={s.resumoLinha}><span style={s.resumoLabel}>Data</span><span>{formatarData(form.data_consulta)}</span></div>
              <div style={s.resumoLinha}><span style={s.resumoLabel}>Horário</span><span>{form.horario}</span></div>
              <div style={s.resumoLinha}><span style={s.resumoLabel}>Paciente</span><span>{form.nome_paciente}</span></div>
              {form.telefone && <div style={s.resumoLinha}><span style={s.resumoLabel}>Telefone</span><span>{form.telefone}</span></div>}
              {form.email && <div style={s.resumoLinha}><span style={s.resumoLabel}>E-mail</span><span>{form.email}</span></div>}
              <div style={s.resumoLinha}><span style={s.resumoLabel}>Motivo</span><span>{form.motivo}</span></div>
            </div>
          </div>
        )}

        {/* Botões de navegação */}
        <div style={s.btnRow}>
          {etapa > 0 && (
            <button style={s.btnVoltar} onClick={voltar}>← Voltar</button>
          )}
          {etapa < 4 && (
            <button style={s.btnAvancar} onClick={validarEtapa}>Avançar →</button>
          )}
          {etapa === 4 && (
            <button style={s.btnConfirmar} onClick={confirmar} disabled={carregando}>
              {carregando ? 'Agendando...' : '✅ Confirmar Agendamento'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Estilos inline ──────────────────────────────────────────────────────────
const s = {
  page:         { minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 100%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px' },
  card:         { background: 'linear-gradient(145deg, #111827, #0f172a)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 640, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' },
  header:       { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 },
  logo:         { fontSize: 40 },
  titulo:       { margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9' },
  subtitulo:    { margin: 0, fontSize: '0.85rem', color: '#64748b' },
  stepper:      { display: 'flex', gap: 4, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 },
  stepItem:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minWidth: 60 },
  stepCircle:   { width: 32, height: 32, borderRadius: '50%', background: '#1e293b', border: '2px solid #334155', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s' },
  stepAtivo:    { background: '#2563eb', borderColor: '#3b82f6', color: '#fff' },
  stepLabel:    { fontSize: '0.65rem', color: '#475569', textAlign: 'center' },
  stepLabelAtivo:{ color: '#60a5fa', fontWeight: 600 },
  erroBox:      { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' },
  etapaBox:     { marginBottom: 24 },
  etapaTitulo:  { color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 },
  grid2:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  opcaoBtn:     { background: '#1e293b', border: '2px solid #334155', borderRadius: 12, padding: '16px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, transition: 'all 0.18s', textAlign: 'left' },
  opcaoBtnAtivo:{ borderColor: '#3b82f6', background: 'rgba(59,130,246,0.12)' },
  opcaoIcon:    { fontSize: '1.4rem' },
  opcaoNome:    { color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 },
  opcaoSub:     { color: '#64748b', fontSize: '0.75rem' },
  gridHorarios: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 },
  horarioBtn:   { background: '#1e293b', border: '2px solid #334155', borderRadius: 8, padding: '10px 6px', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600, position: 'relative', transition: 'all 0.18s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  horarioBtnAtivo: { borderColor: '#22c55e', background: 'rgba(34,197,94,0.12)', color: '#4ade80' },
  horarioBtnOcupado: { opacity: 0.35, cursor: 'not-allowed', borderColor: '#1e293b' },
  ocupadoTag:   { fontSize: '0.55rem', color: '#ef4444', textTransform: 'uppercase' },
  formGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  formField:    { display: 'flex', flexDirection: 'column', gap: 6 },
  label:        { fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' },
  req:          { color: '#f87171' },
  input:        { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', padding: '10px 14px', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  resumo:       { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 },
  resumoLinha:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, fontSize: '0.875rem', color: '#cbd5e1' },
  resumoLabel:  { color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', flexShrink: 0 },
  btnRow:       { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  btnVoltar:    { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 },
  btnAvancar:   { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 },
  btnConfirmar: { background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: '#fff', padding: '12px 28px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 },
  vazio:        { color: '#475569', fontSize: '0.875rem', textAlign: 'center', padding: '24px' },
  successIcon:  { fontSize: 56, textAlign: 'center', marginBottom: 8 },
  successTitle: { color: '#4ade80', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px' },
  successText:  { color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  successObs:   { color: '#64748b', textAlign: 'center', fontSize: '0.82rem', marginTop: 16 },
}
