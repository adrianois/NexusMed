import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import '../InnerPage.css'

// ─ mini bar chart puro em SVG ───────────────────────────────────────────
function BarChart({ dados }) {
  if (!dados.length) return null
  const max = Math.max(...dados.map(d => d.total), 1)
  const W = 480, H = 120, PAD = 28, barW = Math.max(18, Math.floor((W - PAD * 2) / dados.length) - 6)
  const x = i => PAD + i * ((W - PAD * 2) / dados.length) + ((W - PAD * 2) / dados.length - barW) / 2
  const h = v => Math.round((v / max) * (H - 30))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
      {dados.map((d, i) => (
        <g key={d.mes}>
          <rect
            x={x(i)} y={H - 22 - h(d.total)} width={barW} height={h(d.total)}
            rx={4} fill={i === dados.length - 1 ? '#60a5fa' : 'rgba(96,165,250,0.35)'}
          />
          {d.total > 0 && (
            <text x={x(i) + barW / 2} y={H - 25 - h(d.total)} textAnchor='middle'
              fontSize='9' fill='#94a3b8'>{d.total}</text>
          )}
          <text x={x(i) + barW / 2} y={H - 6} textAnchor='middle'
            fontSize='9' fill='#475569'>{d.mes}</text>
        </g>
      ))}
      <line x1={PAD - 4} y1={H - 22} x2={W - PAD + 4} y2={H - 22} stroke='rgba(255,255,255,0.06)' />
    </svg>
  )
}

// ─ card de stat ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = '#60a5fa', sub }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg,#111827,#0f172a)',
      border: `1px solid ${color}22`,
      borderLeft: `4px solid ${color}`,
      borderRadius: '14px', padding: '18px 20px',
      display: 'flex', gap: '14px', alignItems: 'center', flex: '1 1 160px',
    }}>
      <div style={{ fontSize: '1.6rem' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  )
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function MedicoHistorico() {
  const [historico, setHistorico] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busca,     setBusca]     = useState('')
  const [filtroCID, setFiltroCID] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [expandido, setExpandido] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    Promise.all([api.get('/medico/historico'), api.get('/pacientes')])
      .then(([rh, rp]) => { setHistorico(rh.data || []); setPacientes(rp.data || []) })
      .finally(() => setLoading(false))
  }, [])

  const nomePaciente = id => pacientes.find(p => p.id === id)?.nome || '—'

  // ─ estatísticas ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = historico.length
    const pacientesUnicos = new Set(historico.map(h => h.paciente_id)).size
    const comRetorno = historico.filter(h => h.retorno_dias).length
    const mesAtual = new Date().toISOString().slice(0, 7)
    const doMes = historico.filter(h => h.data_atendimento?.startsWith(mesAtual)).length
    // diagnósticos mais freqüentes
    const cids = {}
    historico.forEach(h => { if (h.cid10) cids[h.cid10] = (cids[h.cid10] || 0) + 1 })
    const topCID = Object.entries(cids).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return { total, pacientesUnicos, comRetorno, doMes, topCID }
  }, [historico])

  // ─ dados para o gráfico (últimos 6 meses) ─────────────────────────────
  const dadosGrafico = useMemo(() => {
    const hoje = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1)
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return {
        mes: MESES[d.getMonth()],
        chave,
        total: historico.filter(h => h.data_atendimento?.startsWith(chave)).length,
      }
    })
  }, [historico])

  // ─ meses disponíveis para filtro ───────────────────────────────────────
  const mesesDisponiveis = useMemo(() => {
    const set = new Set(historico.map(h => h.data_atendimento?.slice(0, 7)).filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [historico])

  // ─ lista filtrada ──────────────────────────────────────────────────────────
  const filtrados = useMemo(() => historico.filter(h => {
    const txt = busca.toLowerCase()
    const okBusca = !busca ||
      nomePaciente(h.paciente_id).toLowerCase().includes(txt) ||
      h.diagnostico?.toLowerCase().includes(txt) ||
      h.cid10?.toLowerCase().includes(txt)
    const okCID = !filtroCID || h.cid10 === filtroCID
    const okMes = !filtroMes || h.data_atendimento?.startsWith(filtroMes)
    return okBusca && okCID && okMes
  }), [historico, busca, filtroCID, filtroMes, pacientes])

  const mesLabel = m => {
    const [ano, mes] = m.split('-')
    return `${MESES[Number(mes) - 1]}/${ano}`
  }

  return (
    <PageLayout title='📁 Histórico de Atendimentos'>

      {loading && <p className='page-loading'>⏳ Carregando...</p>}

      {!loading && (
        <>
          {/* ── CARDS DE ESTATÍSTICA ── */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '22px' }}>
            <StatCard icon='📄' label='Total de Atendimentos' value={stats.total}       color='#60a5fa' />
            <StatCard icon='👥' label='Pacientes Atendidos'   value={stats.pacientesUnicos} color='#4ade80' sub='pacientes únicos' />
            <StatCard icon='📅' label='Este Mês'             value={stats.doMes}        color='#fbbf24' />
            <StatCard icon='🔄' label='Com Retorno'           value={stats.comRetorno}   color='#a78bfa' sub='agendaram retorno' />
          </div>

          {/* ── LINHA: GRÁFICO + TOP CIDs ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '22px', flexWrap: 'wrap' }}>
            {/* gráfico */}
            <div style={{
              background: 'linear-gradient(145deg,#111827,#0f172a)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px', padding: '18px 20px',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                📈 Atendimentos — Últimos 6 meses
              </div>
              <BarChart dados={dadosGrafico} />
            </div>

            {/* top CIDs */}
            {stats.topCID.length > 0 && (
              <div style={{
                background: 'linear-gradient(145deg,#111827,#0f172a)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px', padding: '18px 20px', minWidth: '180px',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                  🏆 CIDs Mais Freq.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.topCID.map(([cid, qtd], i) => (
                    <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: ['#60a5fa22','#4ade8022','#fbbf2422'][i],
                        color: ['#60a5fa','#4ade80','#fbbf24'][i],
                        fontSize: '0.68rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{i + 1}</div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>{cid}</div>
                        <div style={{ fontSize: '0.68rem', color: '#475569' }}>{qtd} ocorrência{qtd !== 1 ? 's' : ''}</div>
                      </div>
                      <button
                        className='btn btn-secondary'
                        style={{ fontSize: '0.65rem', padding: '2px 8px', marginLeft: 'auto' }}
                        onClick={() => { setFiltroCID(filtroCID === cid ? '' : cid) }}
                      >{filtroCID === cid ? '✕' : '🔍'}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── FILTROS ── */}
          <div className='inner-toolbar' style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
            <input className='form-input' style={{ maxWidth: '240px' }}
              placeholder='🔍 Paciente ou diagnóstico...'
              value={busca} onChange={e => setBusca(e.target.value)} />
            <select className='form-select' style={{ maxWidth: '160px' }}
              value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
              <option value=''>Todos os meses</option>
              {mesesDisponiveis.map(m => <option key={m} value={m}>{mesLabel(m)}</option>)}
            </select>
            {filtroCID && (
              <div style={{
                background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: '20px', padding: '4px 12px', fontSize: '0.75rem', color: '#a78bfa',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                CID: <strong>{filtroCID}</strong>
                <button onClick={() => setFiltroCID('')} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>✕</button>
              </div>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#475569' }}>
              {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* ── LISTA ── */}
          {filtrados.length === 0 && (
            <div className='page-vazio-box'>
              <span className='page-vazio-icon'>📁</span>
              <p>Nenhum atendimento encontrado.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtrados.map(h => {
              const aberto = expandido === h.id
              return (
                <div key={h.id} style={{
                  background: 'linear-gradient(145deg,#111827,#0f172a)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: `4px solid ${h.cid10 ? '#a78bfa' : '#60a5fa'}`,
                  borderRadius: '12px', overflow: 'hidden',
                }}>
                  {/* cabeçalho do card */}
                  <div style={{
                    padding: '14px 18px', display: 'flex', gap: '14px',
                    alignItems: 'center', flexWrap: 'wrap', cursor: 'pointer',
                  }} onClick={() => setExpandido(aberto ? null : h.id)}>
                    <div style={{ minWidth: '80px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8' }}>
                        {h.data_atendimento ? new Date(h.data_atendimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#475569' }}>data</div>
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                      <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.92rem' }}>
                        👤 {nomePaciente(h.paciente_id)}
                      </div>
                      {h.diagnostico && (
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                          🏥 {h.diagnostico}
                          {h.cid10 && <span style={{ marginLeft: '6px', color: '#a78bfa', fontWeight: 700 }}>{h.cid10}</span>}
                        </div>
                      )}
                      {h.consultas?.motivo && (
                        <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '1px', fontStyle: 'italic' }}>
                          {h.consultas.motivo}
                        </div>
                      )}
                    </div>
                    {h.retorno_dias && (
                      <div style={{
                        background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
                        borderRadius: '8px', padding: '5px 10px', textAlign: 'center',
                        fontSize: '0.7rem', color: '#60a5fa',
                      }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{h.retorno_dias}d</div>
                        <div>retorno</div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button className='btn btn-secondary' style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        onClick={e => { e.stopPropagation(); nav(`/medico/atendimento/${h.consulta_id}`) }}>
                        👁️ Ver
                      </button>
                      <span style={{ color: '#475569', fontSize: '0.8rem' }}>{aberto ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* detalhes expandidos */}
                  {aberto && (
                    <div style={{
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      padding: '16px 18px',
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '14px',
                    }}>
                      {[
                        { label: '📝 Anamnese',     val: h.anamnese },
                        { label: '🔬 Exame Físico', val: h.exame_fisico },
                        { label: '📊 Conduta',       val: h.conduta },
                        { label: '💊 Prescrição',   val: h.prescricao },
                        { label: '📌 Observações',  val: h.observacoes },
                      ].filter(f => f.val).map(f => (
                        <div key={f.label}>
                          <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{f.val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </PageLayout>
  )
}
