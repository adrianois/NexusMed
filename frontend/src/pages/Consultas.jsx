import { useEffect, useState, useMemo } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { useConfirm } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import { enviarConfirmacaoWhatsApp } from '../services/whatsappService'
import { enviarEmailConsulta } from '../services/emailService'
import { useAuth } from '../context/AuthContext'
import './InnerPage.css'

const STATUS_CFG = {
  agendada:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Agendada',   icon: '📅' },
  confirmada: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   label: 'Confirmada', icon: '✅' },
  em_triagem: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: 'Em Triagem', icon: '🩺' },
  triado:     { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Triado',     icon: '🔬' },
  liberada:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  label: 'Liberada',   icon: '🏁' },
}

const DIA_MAP = { 0: null, 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' }
const FORM_INICIAL = { paciente_id: '', medico_id: '', data_consulta: '', horario: '', motivo: '', observacoes: '', status: 'agendada' }

function BadgeStatus({ status }) {
  const cfg = STATUS_CFG[status] || { color: '#64748b', bg: 'transparent', label: status }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33`, padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
      {cfg.label}
    </span>
  )
}

// ── Dashboard card ──────────────────────────────────────────────────────────
function CardDash({ label, valor, icon, color, bg, ativo, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: '1 1 120px', minWidth: 110, background: ativo ? bg : 'rgba(255,255,255,0.03)',
      border: `2px solid ${ativo ? color : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 14, padding: '16px 14px', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
      transition: 'all 0.18s', textAlign: 'left',
    }}>
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      <span style={{ fontSize: '1.6rem', fontWeight: 800, color: ativo ? color : '#e2e8f0', lineHeight: 1 }}>{valor}</span>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: ativo ? color : '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </button>
  )
}

export default function Consultas() {
  const { user } = useAuth()
  const [consultas,     setConsultas]     = useState([])
  const [pacientes,     setPacientes]     = useState([])
  const [medicos,       setMedicos]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [mostrarForm,   setMostrarForm]   = useState(false)
  const [editando,      setEditando]      = useState(null)
  const [salvando,      setSalvando]      = useState(false)
  const [busca,         setBusca]         = useState('')
  const [filtroStatus,  setFiltroStatus]  = useState('todos')
  const [form,          setForm]          = useState(FORM_INICIAL)
  const [enviandoWpp,   setEnviandoWpp]   = useState(null)
  const [enviandoEmail, setEnviandoEmail] = useState(null)
  const { confirmar, ConfirmModalUI } = useConfirm()
  const { toast, ToastUI }            = useToast()

  const carregar = async () => {
    setLoading(true)
    try {
      const [rc, rp, rm] = await Promise.all([api.get('/consultas'), api.get('/pacientes'), api.get('/medicos')])
      setConsultas(rc.data || []); setPacientes(rp.data || []); setMedicos(rm.data || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { carregar() }, [])

  const nomePaciente     = id => pacientes.find(p => p.id === id)?.nome  || '—'
  const nomeMedico       = id => medicos.find(m => m.id === id)?.nome    || '—'
  const emailPaciente    = id => pacientes.find(p => p.id === id)?.email || ''
  const telefonePaciente = id => {
    const p = pacientes.find(p => p.id === id)
    return (p?.celular || p?.telefone || '').replace(/\D/g, '')
  }

  // ── Contadores para o dashboard ──
  const contadores = useMemo(() => {
    const total = consultas.length
    const porStatus = Object.fromEntries(Object.keys(STATUS_CFG).map(s => [s, 0]))
    consultas.forEach(c => { if (porStatus[c.status] !== undefined) porStatus[c.status]++ })
    return { total, ...porStatus }
  }, [consultas])

  const enviarWhatsApp = async (c) => {
    const telefone = telefonePaciente(c.paciente_id)
    if (!telefone) { toast('⚠️ Paciente sem telefone cadastrado.', 'error'); return }
    const phone = telefone.startsWith('55') ? telefone : `55${telefone}`
    const dataFormatada = c.data_consulta ? new Date(c.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
    setEnviandoWpp(c.id)
    try {
      await enviarConfirmacaoWhatsApp({ phone, paciente: nomePaciente(c.paciente_id), data: dataFormatada, hora: c.horario || 'A definir', medico: nomeMedico(c.medico_id), clinica: 'NexusMed' })
      toast('✅ Mensagem enviada via WhatsApp!', 'success')
    } catch (err) {
      toast('Erro ao enviar WhatsApp: ' + (err.response?.data?.error || err.message), 'error')
    } finally { setEnviandoWpp(null) }
  }

  const enviarEmail = async (c) => {
    const email = emailPaciente(c.paciente_id)
    if (!email) { toast('⚠️ Paciente sem e-mail cadastrado.', 'error'); return }
    const dataFormatada = c.data_consulta ? new Date(c.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
    setEnviandoEmail(c.id)
    try {
      await enviarEmailConsulta({
        para: email, paciente: nomePaciente(c.paciente_id),
        clinica_id: user?.clinica_id || null, medico: nomeMedico(c.medico_id),
        data: dataFormatada, hora: c.horario || 'A definir', consulta_id: c.id,
      })
      toast(`✉️ E-mail com link de confirmação enviado para ${email}!`, 'success')
    } catch (err) {
      toast('Erro ao enviar e-mail: ' + (err.response?.data?.error || err.message), 'error')
    } finally { setEnviandoEmail(null) }
  }

  const horariosDisponiveis = useMemo(() => {
    if (!form.medico_id || !form.data_consulta) return []
    const medico = medicos.find(m => m.id === form.medico_id)
    if (!medico?.agenda) return []
    const [ano, mes, dia] = form.data_consulta.split('-').map(Number)
    const diaSemana = new Date(ano, mes - 1, dia).getDay()
    const chave = DIA_MAP[diaSemana]
    if (!chave) return []
    const horariosAgenda = medico.agenda[chave] || []
    if (horariosAgenda.length === 0) return []
    const ocupados = consultas
      .filter(c => c.medico_id === form.medico_id && c.data_consulta === form.data_consulta && c.id !== editando)
      .map(c => c.horario)
    return horariosAgenda.map(h => ({ hora: h, ocupado: ocupados.includes(h) }))
  }, [form.medico_id, form.data_consulta, medicos, consultas, editando])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value, ...(name === 'medico_id' || name === 'data_consulta' ? { horario: '' } : {}) }))
  }

  const abrirNovo   = () => { setForm(FORM_INICIAL); setEditando(null); setMostrarForm(true) }
  const abrirEditar = c  => {
    setForm({ paciente_id: c.paciente_id||'', medico_id: c.medico_id||'', data_consulta: c.data_consulta||'', horario: c.horario||'', motivo: c.motivo||'', observacoes: c.observacoes||'', status: c.status||'agendada' })
    setEditando(c.id); setMostrarForm(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.paciente_id || !form.data_consulta || !form.motivo) { toast('Paciente, data e motivo são obrigatórios!', 'error'); return }
    setSalvando(true)
    try {
      if (editando) { await api.put(`/consultas/${editando}`, form); toast('Consulta atualizada!', 'success') }
      else          { await api.post('/consultas', form);             toast('Consulta agendada!',   'success') }
      setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL); carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
    finally { setSalvando(false) }
  }

  const alterarStatus = async (id, novoStatus) => {
    try {
      await api.patch(`/consultas/${id}/status`, { status: novoStatus })
      toast(`Status atualizado para "${STATUS_CFG[novoStatus]?.label || novoStatus}".`, 'success')
      carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
  }

  const excluir = async (id) => {
    const ok = await confirmar({ titulo: 'Excluir Consulta', mensagem: 'Deseja excluir esta consulta? Ela não pode ter prontuários vinculados.', labelOk: 'Excluir', tipo: 'danger' })
    if (!ok) return
    try {
      await api.delete(`/consultas/${id}`)
      toast('Consulta excluída.', 'success'); carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
  }

  const filtradas = useMemo(() => consultas.filter(c => {
    const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus
    const matchBusca  = !busca ||
      nomePaciente(c.paciente_id).toLowerCase().includes(busca.toLowerCase()) ||
      nomeMedico(c.medico_id).toLowerCase().includes(busca.toLowerCase()) ||
      c.motivo?.toLowerCase().includes(busca.toLowerCase())
    return matchStatus && matchBusca
  }), [consultas, filtroStatus, busca, pacientes, medicos])

  const proximosStatus = {
    agendada:   ['confirmada'],
    confirmada: ['liberada'],
    em_triagem: ['triado'],
    triado:     ['liberada'],
    liberada:   [],
  }

  const dicaHorario = () => {
    if (!form.medico_id)     return { texto: 'Selecione um médico primeiro', cor: '#475569' }
    if (!form.data_consulta) return { texto: 'Selecione uma data primeiro',  cor: '#475569' }
    if (horariosDisponiveis.length === 0) return { texto: '⚠️ Médico sem horários configurados para este dia', cor: '#fbbf24' }
    const livres = horariosDisponiveis.filter(h => !h.ocupado).length
    return { texto: `${livres} horário${livres !== 1 ? 's' : ''} disponível${livres !== 1 ? 'is' : ''}`, cor: '#4ade80' }
  }
  const dica = dicaHorario()

  const btnAcao = (bg, disabled) => ({
    fontSize: '0.75rem', padding: '4px 8px', border: 'none', borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#1e293b' : bg,
    color: '#fff', fontWeight: 700,
    opacity: disabled ? 0.5 : 1, transition: 'opacity 0.2s',
  })

  return (
    <PageLayout title='📅 Consultas'>
      <ConfirmModalUI /><ToastUI />

      {/* ── Dashboard ── */}
      {!loading && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <CardDash
            label='Total' valor={contadores.total} icon='📋' color='#e2e8f0'
            bg='rgba(255,255,255,0.06)'
            ativo={filtroStatus === 'todos'}
            onClick={() => setFiltroStatus('todos')}
          />
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <CardDash
              key={key}
              label={cfg.label} valor={contadores[key] || 0}
              icon={cfg.icon} color={cfg.color} bg={cfg.bg}
              ativo={filtroStatus === key}
              onClick={() => setFiltroStatus(filtroStatus === key ? 'todos' : key)}
            />
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className='inner-toolbar'>
        <input className='form-input' style={{ maxWidth: '260px' }}
          placeholder='🔍 Buscar paciente, médico ou motivo...'
          value={busca} onChange={e => setBusca(e.target.value)} />

        {/* Filtro por status (select compacto) */}
        <select className='form-select' style={{ maxWidth: '180px' }}
          value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value='todos'>Todos os status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        <button className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => { if (mostrarForm) { setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL) } else abrirNovo() }}>
          {mostrarForm ? '✖ Cancelar' : '+ Nova Consulta'}
        </button>
      </div>

      {/* Tag de filtro ativo */}
      {filtroStatus !== 'todos' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Filtrando por:</span>
          <span style={{
            background: STATUS_CFG[filtroStatus]?.bg,
            color: STATUS_CFG[filtroStatus]?.color,
            border: `1px solid ${STATUS_CFG[filtroStatus]?.color}44`,
            padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700
          }}>
            {STATUS_CFG[filtroStatus]?.icon} {STATUS_CFG[filtroStatus]?.label} ({filtradas.length})
          </span>
          <button onClick={() => setFiltroStatus('todos')}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.8rem' }}>
            ✕ Limpar
          </button>
        </div>
      )}

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>{editando ? '✏️ Editar Consulta' : 'Agendar Nova Consulta'}</h3>
          <form onSubmit={handleSubmit} className='inner-form'>
            <div className='form-field form-field--full'>
              <label className='form-label'>Paciente <span className='required'>*</span></label>
              <select className='form-select' name='paciente_id' value={form.paciente_id} onChange={handleChange} required>
                <option value=''>Selecione o paciente</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className='form-field form-field--full'>
              <label className='form-label'>Médico</label>
              <select className='form-select' name='medico_id' value={form.medico_id} onChange={handleChange}>
                <option value=''>Sem médico definido</option>
                {medicos.map(m => <option key={m.id} value={m.id}>{m.nome}{m.especialidade ? ` — ${m.especialidade}` : ''}</option>)}
              </select>
            </div>
            <div className='form-field'>
              <label className='form-label'>Data <span className='required'>*</span></label>
              <input className='form-input' type='date' name='data_consulta' value={form.data_consulta} onChange={handleChange} required />
            </div>
            <div className='form-field'>
              <label className='form-label'>
                Horário
                <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: dica.cor, fontWeight: 400 }}>{dica.texto}</span>
              </label>
              {horariosDisponiveis.length > 0 ? (
                <select className='form-select' name='horario' value={form.horario} onChange={handleChange}>
                  <option value=''>Selecione o horário</option>
                  {horariosDisponiveis.map(({ hora, ocupado }) => (
                    <option key={hora} value={hora} disabled={ocupado}>{hora}{ocupado ? ' — Ocupado' : ''}</option>
                  ))}
                </select>
              ) : (
                <input className='form-input' type='time' name='horario' value={form.horario} onChange={handleChange} />
              )}
            </div>
            <div className='form-field form-field--full'>
              <label className='form-label'>Motivo <span className='required'>*</span></label>
              <input className='form-input' name='motivo' value={form.motivo} onChange={handleChange} placeholder='Motivo da consulta' required />
            </div>
            <div className='form-field form-field--full'>
              <label className='form-label'>Observações</label>
              <textarea className='form-textarea' name='observacoes' value={form.observacoes} onChange={handleChange} rows={2} placeholder='Observações adicionais...' />
            </div>
            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando...' : editando ? '✓ Atualizar' : '✓ Agendar'}
              </button>
              <button type='button' className='btn btn-secondary'
                onClick={() => { setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL) }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {!loading && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead><tr><th>Data</th><th>Horário</th><th>Paciente</th><th>Médico</th><th>Motivo</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  {filtroStatus !== 'todos'
                    ? `Nenhuma consulta com status "${STATUS_CFG[filtroStatus]?.label}".`
                    : 'Nenhuma consulta encontrada.'}
                </td></tr>
              )}
              {filtradas.map(c => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{c.data_consulta ? new Date(c.data_consulta+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                  <td style={{ color: '#94a3b8' }}>{c.horario||'—'}</td>
                  <td style={{ fontWeight: 600 }}>{nomePaciente(c.paciente_id)}</td>
                  <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{nomeMedico(c.medico_id)}</td>
                  <td style={{ fontSize: '0.82rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.motivo}</td>
                  <td><BadgeStatus status={c.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button className='btn btn-secondary' style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => abrirEditar(c)}>✏️</button>
                      <button title={`WhatsApp — ${nomePaciente(c.paciente_id)}`}
                        disabled={enviandoWpp === c.id} onClick={() => enviarWhatsApp(c)}
                        style={btnAcao('#25d366', enviandoWpp === c.id)}>
                        {enviandoWpp === c.id ? '⏳' : '📲'}
                      </button>
                      <button title={`E-mail com confirmação — ${nomePaciente(c.paciente_id)}`}
                        disabled={enviandoEmail === c.id} onClick={() => enviarEmail(c)}
                        style={btnAcao('#6366f1', enviandoEmail === c.id)}>
                        {enviandoEmail === c.id ? '⏳' : '✉️'}
                      </button>
                      {(proximosStatus[c.status] || []).map(ns => (
                        <button key={ns} className='btn btn-primary' style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => alterarStatus(c.id, ns)}>
                          → {STATUS_CFG[ns]?.label}
                        </button>
                      ))}
                      <button className='btn btn-danger' style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => excluir(c.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}
