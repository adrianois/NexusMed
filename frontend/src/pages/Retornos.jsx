import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/Toast'
import './InnerPage.css'

const STATUS_CFG = {
  atrasado: { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   label: 'Atrasado',  emoji: '⚠️' },
  pendente: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: 'Pendente',  emoji: '⏳' },
  agendado: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   label: 'Agendado',  emoji: '✅' },
}

function BadgeStatus({ status }) {
  const cfg = STATUS_CFG[status] || { color: '#64748b', bg: 'transparent', label: status, emoji: '' }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}33`,
      padding: '2px 10px', borderRadius: '20px',
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  )
}

function diasRestantes(dataPrevista) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const prev = new Date(dataPrevista + 'T12:00:00')
  const diff = Math.round((prev - hoje) / (1000 * 60 * 60 * 24))
  if (diff < 0)  return { texto: `${Math.abs(diff)}d atrasado`, cor: '#f87171' }
  if (diff === 0) return { texto: 'hoje',         cor: '#fbbf24' }
  if (diff <= 7) return { texto: `${diff}d`,      cor: '#fbbf24' }
  return              { texto: `${diff}d`,         cor: '#4ade80' }
}

export default function Retornos() {
  const [retornos,     setRetornos]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [busca,        setBusca]        = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const { toast, ToastUI } = useToast()
  const nav = useNavigate()

  const carregar = async (params = {}) => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (params.status) query.set('status', params.status)
      if (params.busca)  query.set('busca',  params.busca)
      const { data } = await api.get(`/retornos?${query.toString()}`)
      setRetornos(data || [])
    } catch (err) {
      toast('Erro ao carregar retornos: ' + (err.response?.data?.error || err.message), 'error')
    } finally {
      setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  // Debounce na busca
  useEffect(() => {
    const t = setTimeout(() => carregar({ status: filtroStatus, busca }), 350)
    return () => clearTimeout(t)
  }, [busca, filtroStatus])

  // Contadores por status
  const contagem = {
    atrasado: retornos.filter(r => r.status === 'atrasado').length,
    pendente: retornos.filter(r => r.status === 'pendente').length,
    agendado: retornos.filter(r => r.status === 'agendado').length,
  }

  return (
    <PageLayout title='🔄 Retornos Médicos'>
      <ToastUI />

      {/* ── Descrição */}
      <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
        Pacientes cujos médicos indicaram retorno no prontuário. Verifique quem precisa de uma nova consulta agendada.
      </p>

      {/* ── Cards resumo */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '22px' }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div
            key={key}
            onClick={() => setFiltroStatus(filtroStatus === key ? '' : key)}
            style={{
              flex: '1 1 130px', padding: '14px 18px',
              background: filtroStatus === key ? cfg.bg : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filtroStatus === key ? cfg.color : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: cfg.color }}>
              {contagem[key] ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
              {cfg.emoji} {cfg.label}
            </div>
          </div>
        ))}
        <div style={{
          flex: '1 1 130px', padding: '14px 18px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#94a3b8' }}>
            {retornos.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
            📋 Total
          </div>
        </div>
      </div>

      {/* ── Toolbar */}
      <div className='inner-toolbar'>
        <input
          className='form-input'
          style={{ maxWidth: '280px' }}
          placeholder='🔍 Buscar por nome do paciente...'
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
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>
        <button
          className='btn btn-secondary'
          onClick={() => carregar({ status: filtroStatus, busca })}
          title='Atualizar lista'
        >
          🔄 Atualizar
        </button>
      </div>

      {/* ── Tabela */}
      {loading && <p className='page-loading'>Carregando...</p>}

      {!loading && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Atendimento</th>
                <th>Retorno em</th>
                <th>Data Prevista</th>
                <th>Prazo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {retornos.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    {filtroStatus || busca
                      ? 'Nenhum retorno encontrado com os filtros aplicados.'
                      : 'Nenhum paciente com retorno pendente. 🎉'}
                  </td>
                </tr>
              )}
              {retornos.map(r => {
                const prazo = diasRestantes(r.data_prevista)
                return (
                  <tr key={r.prontuario_id} style={{
                    background: r.status === 'atrasado' ? 'rgba(239,68,68,0.04)' : undefined,
                  }}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.paciente_nome}</div>
                      {r.paciente_tel && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.paciente_tel}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{r.medico_nome}</div>
                      {r.especialidade && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.especialidade}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.83rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {r.data_atendimento
                        ? new Date(r.data_atendimento + 'T12:00:00').toLocaleDateString('pt-BR')
                        : '—'}
                      {r.motivo_original && (
                        <div style={{ fontSize: '0.7rem', color: '#475569', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.motivo_original}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#a78bfa' }}>
                      {r.retorno_dias}d
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {r.data_prevista
                        ? new Date(r.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: prazo.cor }}>
                        {prazo.texto}
                      </span>
                    </td>
                    <td><BadgeStatus status={r.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {r.status !== 'agendado' && (
                          <button
                            className='btn btn-primary'
                            style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
                            onClick={() => nav('/consultas')}
                            title='Agendar nova consulta para este paciente'
                          >
                            📅 Agendar
                          </button>
                        )}
                        {r.status === 'agendado' && r.nova_consulta && (
                          <span style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                            ✅ {new Date(r.nova_consulta.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}
