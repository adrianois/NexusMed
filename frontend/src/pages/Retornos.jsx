import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { useConfirm } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import './InnerPage.css'

const STATUS_CFG = {
  pendente:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: 'Pendente'  },
  agendado:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Agendado'  },
  realizado: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   label: 'Realizado' },
  cancelado: { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   label: 'Cancelado' },
}

const FORM_INICIAL = {
  consulta_id: '',
  paciente_id: '',
  medico_id: '',
  data_retorno: '',
  motivo: '',
  observacoes: '',
  status: 'pendente',
}

function BadgeStatus({ status }) {
  const cfg = STATUS_CFG[status] || { color: '#64748b', bg: 'transparent', label: status }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}33`,
      padding: '2px 10px', borderRadius: '20px',
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      {cfg.label}
    </span>
  )
}

export default function Retornos() {
  const [retornos,    setRetornos]    = useState([])
  const [pacientes,   setPacientes]   = useState([])
  const [medicos,     setMedicos]     = useState([])
  const [consultas,   setConsultas]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [salvando,    setSalvando]    = useState(false)
  const [busca,       setBusca]       = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [form,        setForm]        = useState(FORM_INICIAL)
  const { confirmar, ConfirmModalUI } = useConfirm()
  const { toast, ToastUI }            = useToast()

  const carregar = async () => {
    setLoading(true)
    try {
      const [rr, rp, rm, rc] = await Promise.all([
        api.get('/retornos'),
        api.get('/pacientes'),
        api.get('/medicos'),
        api.get('/consultas'),
      ])
      setRetornos(rr.data  || [])
      setPacientes(rp.data || [])
      setMedicos(rm.data   || [])
      setConsultas(rc.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const nomePaciente = id => pacientes.find(p => p.id === id)?.nome || '—'
  const nomeMedico   = id => medicos.find(m => m.id === id)?.nome   || '—'

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const abrirNovo = () => {
    setForm(FORM_INICIAL); setEditando(null); setMostrarForm(true)
  }

  const abrirEditar = r => {
    setForm({
      consulta_id:  r.consulta_id  || '',
      paciente_id:  r.paciente_id  || '',
      medico_id:    r.medico_id    || '',
      data_retorno: r.data_retorno || '',
      motivo:       r.motivo       || '',
      observacoes:  r.observacoes  || '',
      status:       r.status       || 'pendente',
    })
    setEditando(r.id)
    setMostrarForm(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.paciente_id || !form.data_retorno || !form.motivo) {
      toast('Paciente, data de retorno e motivo são obrigatórios!', 'error')
      return
    }
    setSalvando(true)
    try {
      if (editando) {
        await api.put(`/retornos/${editando}`, form)
        toast('Retorno atualizado!', 'success')
      } else {
        await api.post('/retornos', form)
        toast('Retorno registrado!', 'success')
      }
      setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL); carregar()
    } catch (err) {
      toast('Erro: ' + (err.response?.data?.error || err.message), 'error')
    } finally { setSalvando(false) }
  }

  const alterarStatus = async (id, novoStatus) => {
    try {
      await api.patch(`/retornos/${id}/status`, { status: novoStatus })
      toast(`Status atualizado para "${STATUS_CFG[novoStatus]?.label || novoStatus}".`, 'success')
      carregar()
    } catch (err) {
      toast('Erro: ' + (err.response?.data?.error || err.message), 'error')
    }
  }

  const excluir = async id => {
    const ok = await confirmar({
      titulo: 'Excluir Retorno',
      mensagem: 'Deseja excluir este registro de retorno?',
      labelOk: 'Excluir', tipo: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/retornos/${id}`)
      toast('Retorno excluído.', 'success'); carregar()
    } catch (err) {
      toast('Erro: ' + (err.response?.data?.error || err.message), 'error')
    }
  }

  const filtrados = retornos.filter(r => {
    const matchBusca = !busca ||
      nomePaciente(r.paciente_id).toLowerCase().includes(busca.toLowerCase()) ||
      nomeMedico(r.medico_id).toLowerCase().includes(busca.toLowerCase())   ||
      r.motivo?.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = !filtroStatus || r.status === filtroStatus
    return matchBusca && matchStatus
  })

  // Próximas transições de status permitidas
  const proximosStatus = {
    pendente:  ['agendado', 'cancelado'],
    agendado:  ['realizado', 'cancelado'],
    realizado: [],
    cancelado: [],
  }

  // Contadores por status para o resumo
  const contagem = Object.keys(STATUS_CFG).reduce((acc, s) => {
    acc[s] = retornos.filter(r => r.status === s).length
    return acc
  }, {})

  return (
    <PageLayout title='🔄 Retornos Médicos'>
      <ConfirmModalUI /><ToastUI />

      {/* ── Cards resumo ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div
            key={key}
            onClick={() => setFiltroStatus(filtroStatus === key ? '' : key)}
            style={{
              flex: '1 1 120px', padding: '12px 16px',
              background: filtroStatus === key ? cfg.bg : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filtroStatus === key ? cfg.color : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: cfg.color }}>
              {contagem[key] ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              {cfg.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className='inner-toolbar'>
        <input
          className='form-input'
          style={{ maxWidth: '260px' }}
          placeholder='🔍 Buscar paciente, médico ou motivo...'
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select
          className='form-select'
          style={{ maxWidth: '160px' }}
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
        >
          <option value=''>Todos os status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button
          className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => {
            if (mostrarForm) {
              setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL)
            } else abrirNovo()
          }}
        >
          {mostrarForm ? '✖ Cancelar' : '+ Novo Retorno'}
        </button>
      </div>

      {/* ── Formulário ── */}
      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>
            {editando ? '✏️ Editar Retorno' : '📋 Registrar Novo Retorno'}
          </h3>
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
                {medicos.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nome}{m.especialidade ? ` — ${m.especialidade}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className='form-field form-field--full'>
              <label className='form-label'>Consulta de Origem</label>
              <select className='form-select' name='consulta_id' value={form.consulta_id} onChange={handleChange}>
                <option value=''>Sem consulta vinculada</option>
                {consultas
                  .filter(c => !form.paciente_id || c.paciente_id === form.paciente_id)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.data_consulta
                        ? new Date(c.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR')
                        : '—'}{' '}
                      — {c.motivo}
                    </option>
                  ))}
              </select>
            </div>

            <div className='form-field'>
              <label className='form-label'>Data do Retorno <span className='required'>*</span></label>
              <input
                className='form-input'
                type='date'
                name='data_retorno'
                value={form.data_retorno}
                onChange={handleChange}
                required
              />
            </div>

            <div className='form-field'>
              <label className='form-label'>Status</label>
              <select className='form-select' name='status' value={form.status} onChange={handleChange}>
                {Object.entries(STATUS_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className='form-field form-field--full'>
              <label className='form-label'>Motivo <span className='required'>*</span></label>
              <input
                className='form-input'
                name='motivo'
                value={form.motivo}
                onChange={handleChange}
                placeholder='Motivo indicado pelo médico para o retorno'
                required
              />
            </div>

            <div className='form-field form-field--full'>
              <label className='form-label'>Observações</label>
              <textarea
                className='form-textarea'
                name='observacoes'
                value={form.observacoes}
                onChange={handleChange}
                rows={2}
                placeholder='Observações adicionais sobre o retorno...'
              />
            </div>

            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando...' : editando ? '✓ Atualizar' : '✓ Registrar'}
              </button>
              <button
                type='button'
                className='btn btn-secondary'
                onClick={() => { setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL) }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tabela ── */}
      {loading && <p className='page-loading'>Carregando...</p>}
      {!loading && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead>
              <tr>
                <th>Data Retorno</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Motivo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    Nenhum retorno encontrado.
                  </td>
                </tr>
              )}
              {filtrados.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {r.data_retorno
                      ? new Date(r.data_retorno + 'T12:00:00').toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td style={{ fontWeight: 600 }}>{nomePaciente(r.paciente_id)}</td>
                  <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{nomeMedico(r.medico_id)}</td>
                  <td style={{
                    fontSize: '0.82rem', maxWidth: '200px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {r.motivo}
                  </td>
                  <td><BadgeStatus status={r.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button
                        className='btn btn-secondary'
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => abrirEditar(r)}
                      >✏️</button>
                      {(proximosStatus[r.status] || []).map(ns => (
                        <button
                          key={ns}
                          className='btn btn-primary'
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                          onClick={() => alterarStatus(r.id, ns)}
                        >
                          → {STATUS_CFG[ns]?.label}
                        </button>
                      ))}
                      <button
                        className='btn btn-danger'
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => excluir(r.id)}
                      >🗑️</button>
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
