/**
 * ModalAgendarRetorno
 * Modal reutilizável para agendar uma nova consulta de retorno.
 * Recebe paciente_id e motivo pré-preenchidos e carrega
 * médicos + horários disponíveis igual ao Consultas.jsx.
 *
 * Props:
 *   aberto         {boolean}
 *   onFechar       {function}
 *   onAgendado     {function}  chamado após sucesso
 *   paciente_id    {string}
 *   paciente_nome  {string}
 *   motivo_sugerido {string}
 *   retorno_dias   {number}   usado para calcular data sugerida
 */
import { useEffect, useState, useMemo } from 'react'
import api from '../api'
import { useToast } from './Toast'

const DIA_MAP = { 0: null, 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' }

const FORM_VAZIO = (paciente_id, motivo, dataSugerida) => ({
  paciente_id:   paciente_id  || '',
  medico_id:     '',
  data_consulta: dataSugerida || '',
  horario:       '',
  motivo:        motivo       || 'Retorno',
  observacoes:   '',
})

export default function ModalAgendarRetorno({
  aberto, onFechar, onAgendado,
  paciente_id, paciente_nome,
  motivo_sugerido, retorno_dias,
}) {
  const [medicos,   setMedicos]   = useState([])
  const [consultas, setConsultas] = useState([])
  const [salvando,  setSalvando]  = useState(false)
  const [form,      setForm]      = useState({})
  const { toast, ToastUI } = useToast()

  // Calcula data sugerida: hoje + retorno_dias
  const dataSugerida = useMemo(() => {
    if (!retorno_dias) return ''
    const d = new Date()
    d.setDate(d.getDate() + Number(retorno_dias))
    return d.toISOString().split('T')[0]
  }, [retorno_dias])

  useEffect(() => {
    if (!aberto) return
    setForm(FORM_VAZIO(paciente_id, motivo_sugerido ? `Retorno — ${motivo_sugerido}` : 'Retorno', dataSugerida))
    // Carrega médicos e consultas para verificar ocupação
    Promise.all([api.get('/medicos'), api.get('/consultas')])
      .then(([rm, rc]) => {
        setMedicos(rm.data  || [])
        setConsultas(rc.data || [])
      })
      .catch(() => {})
  }, [aberto, paciente_id, motivo_sugerido, dataSugerida])

  // Horários disponíveis (igual lógica do Consultas.jsx)
  const horariosDisponiveis = useMemo(() => {
    if (!form.medico_id || !form.data_consulta) return []
    const medico = medicos.find(m => m.id === form.medico_id)
    if (!medico?.agenda) return []
    const [ano, mes, dia] = form.data_consulta.split('-').map(Number)
    const chave = DIA_MAP[new Date(ano, mes - 1, dia).getDay()]
    if (!chave) return []
    const horariosAgenda = medico.agenda[chave] || []
    const ocupados = consultas
      .filter(c => c.medico_id === form.medico_id && c.data_consulta === form.data_consulta)
      .map(c => c.horario)
    return horariosAgenda.map(h => ({ hora: h, ocupado: ocupados.includes(h) }))
  }, [form.medico_id, form.data_consulta, medicos, consultas])

  const set = (field, val) => setForm(p => ({
    ...p, [field]: val,
    ...(field === 'medico_id' || field === 'data_consulta' ? { horario: '' } : {}),
  }))

  const dicaHorario = () => {
    if (!form.medico_id)     return { texto: 'Selecione um médico primeiro', cor: '#475569' }
    if (!form.data_consulta) return { texto: 'Selecione uma data primeiro',  cor: '#475569' }
    if (!horariosDisponiveis.length) return { texto: '⚠️ Médico sem horários neste dia', cor: '#fbbf24' }
    const livres = horariosDisponiveis.filter(h => !h.ocupado).length
    return { texto: `${livres} horário${livres !== 1 ? 's' : ''} disponível${livres !== 1 ? 'is' : ''}`, cor: '#4ade80' }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.paciente_id || !form.data_consulta || !form.motivo) {
      toast('Paciente, data e motivo são obrigatórios!', 'error'); return
    }
    setSalvando(true)
    try {
      const { data } = await api.post('/consultas', form)
      toast('Retorno agendado com sucesso! 📅', 'success')
      setTimeout(() => { onAgendado?.(data); onFechar() }, 900)
    } catch (err) {
      toast('Erro: ' + (err.response?.data?.error || err.message), 'error')
    } finally { setSalvando(false) }
  }

  if (!aberto) return null

  const dica = dicaHorario()

  return (
    <>
      <ToastUI />
      {/* Overlay */}
      <div
        onClick={onFechar}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(520px, 94vw)',
        background: 'linear-gradient(145deg,#111827,#0f172a)',
        border: '1px solid rgba(96,165,250,0.2)',
        borderRadius: '18px', padding: '28px 30px',
        zIndex: 1001, boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#e2e8f0' }}>
              📅 Agendar Retorno
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
              Paciente: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{paciente_nome || '—'}</span>
              {retorno_dias > 0 && (
                <span style={{ marginLeft: '10px', color: '#a78bfa' }}>
                  · Retorno indicado em {retorno_dias} dias
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onFechar}
            style={{
              background: 'transparent', border: 'none',
              color: '#475569', fontSize: '1.2rem',
              cursor: 'pointer', lineHeight: 1, padding: '2px 6px',
            }}
          >✕</button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>

          {/* Médico */}
          <div style={{ marginBottom: '14px' }}>
            <label style={LABEL}>Médico</label>
            <select className='form-select' value={form.medico_id}
              onChange={e => set('medico_id', e.target.value)}>
              <option value=''>Sem médico definido</option>
              {medicos.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nome}{m.especialidade ? ` — ${m.especialidade}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div style={{ marginBottom: '14px' }}>
            <label style={LABEL}>
              Data <span style={{ color: '#f87171' }}>*</span>
              {retorno_dias > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#a78bfa', fontWeight: 400 }}>
                  (sugerida: {new Date(dataSugerida + 'T12:00:00').toLocaleDateString('pt-BR')})
                </span>
              )}
            </label>
            <input className='form-input' type='date'
              value={form.data_consulta}
              onChange={e => set('data_consulta', e.target.value)}
              required
            />
          </div>

          {/* Horário */}
          <div style={{ marginBottom: '14px' }}>
            <label style={LABEL}>
              Horário
              <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: dica.cor, fontWeight: 400 }}>{dica.texto}</span>
            </label>
            {horariosDisponiveis.length > 0 ? (
              <select className='form-select' value={form.horario}
                onChange={e => set('horario', e.target.value)}>
                <option value=''>Selecione o horário</option>
                {horariosDisponiveis.map(({ hora, ocupado }) => (
                  <option key={hora} value={hora} disabled={ocupado}>
                    {hora}{ocupado ? ' — Ocupado' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input className='form-input' type='time'
                value={form.horario}
                onChange={e => set('horario', e.target.value)}
              />
            )}
          </div>

          {/* Motivo */}
          <div style={{ marginBottom: '14px' }}>
            <label style={LABEL}>Motivo <span style={{ color: '#f87171' }}>*</span></label>
            <input className='form-input'
              value={form.motivo}
              onChange={e => set('motivo', e.target.value)}
              placeholder='Motivo da consulta'
              required
            />
          </div>

          {/* Observações */}
          <div style={{ marginBottom: '20px' }}>
            <label style={LABEL}>Observações</label>
            <textarea className='form-textarea' rows={2}
              value={form.observacoes}
              onChange={e => set('observacoes', e.target.value)}
              placeholder='Observações adicionais...'
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type='submit' className='btn btn-success'
              style={{ flex: 1, padding: '11px', fontWeight: 700 }}
              disabled={salvando}>
              {salvando ? '⏳ Agendando...' : '✓ Confirmar Agendamento'}
            </button>
            <button type='button' className='btn btn-secondary'
              style={{ padding: '11px 18px' }}
              onClick={onFechar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

const LABEL = {
  display: 'block',
  fontSize: '0.75rem', fontWeight: 700,
  color: '#64748b', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.05em',
}
