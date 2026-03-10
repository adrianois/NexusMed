import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import './InnerPage.css'

const ACOES = ['','login','login_falhou','register','criar','editar','excluir','status']
const TABELAS = ['','usuarios','clinicas','medicos','pacientes','consultas','prontuarios']

const ACAO_CONFIG = {
  criar:        { bg:'#14532d', color:'#86efac', label:'Criar'         },
  editar:       { bg:'#1e3a5f', color:'#93c5fd', label:'Editar'        },
  excluir:      { bg:'#450a0a', color:'#fca5a5', label:'Excluir'       },
  status:       { bg:'#3b0764', color:'#d8b4fe', label:'Status'        },
  login:        { bg:'#1c1917', color:'#a8a29e', label:'Login'         },
  login_falhou: { bg:'#7c2d12', color:'#fdba74', label:'Login Falhou'  },
  register:     { bg:'#0c4a6e', color:'#7dd3fc', label:'Registro'      },
}

const TABELA_EMOJI = {
  usuarios: '👤', clinicas: '🏥', medicos: '👨‍⚕️',
  pacientes: '👥', consultas: '📅', prontuarios: '📋',
}

export default function Logs() {
  const [logs, setLogs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState(null)
  const [page, setPage]       = useState(1)
  const [filtros, setFiltros] = useState({ tabela: '', acao: '' })
  const [expandido, setExpandido] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true); setErro(null)
    try {
      const params = new URLSearchParams({ page })
      if (filtros.tabela) params.append('tabela', filtros.tabela)
      if (filtros.acao)   params.append('acao',   filtros.acao)
      const { data } = await api.get(`/logs?${params}`)
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch { setErro('Erro ao carregar logs.') }
    finally { setLoading(false) }
  }, [page, filtros])

  useEffect(() => { carregar() }, [carregar])

  const handleFiltro = e => {
    setFiltros(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setPage(1)
  }

  const formatarData = iso => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getAcao = a => ACAO_CONFIG[a] || { bg:'#1e293b', color:'#94a3b8', label: a }
  const totalPaginas = Math.ceil(total / 50)

  return (
    <PageLayout title='📝 Logs de Auditoria'>
      {/* Filtros */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap', alignItems:'flex-end' }}>
        <div>
          <label style={{ display:'block', fontSize:'0.75rem', color:'#94a3b8', marginBottom:'4px' }}>Tabela</label>
          <select name='tabela' value={filtros.tabela} onChange={handleFiltro}
            style={{ background:'#1e293b', color:'#e2e8f0', border:'1px solid #334155', borderRadius:'6px', padding:'7px 12px', fontSize:'0.85rem' }}>
            {TABELAS.map(t => <option key={t} value={t}>{t ? `${TABELA_EMOJI[t] || ''} ${t}` : 'Todas as tabelas'}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display:'block', fontSize:'0.75rem', color:'#94a3b8', marginBottom:'4px' }}>Ação</label>
          <select name='acao' value={filtros.acao} onChange={handleFiltro}
            style={{ background:'#1e293b', color:'#e2e8f0', border:'1px solid #334155', borderRadius:'6px', padding:'7px 12px', fontSize:'0.85rem' }}>
            {ACOES.map(a => <option key={a} value={a}>{a ? getAcao(a).label : 'Todas as ações'}</option>)}
          </select>
        </div>
        <div style={{ marginLeft:'auto', color:'#64748b', fontSize:'0.8rem', alignSelf:'center' }}>
          {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </div>
      </div>

      {loading && <p className='page-loading'>Carregando logs...</p>}
      {erro    && <p className='page-erro'>{erro}</p>}

      {!loading && !erro && (
        <>
          {logs.length === 0
            ? <div className='page-vazio-box'><span className='page-vazio-icon'>📝</span><p>Nenhum log encontrado.</p></div>
            : (
              <div className='table-wrapper'>
                <table className='data-table'>
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Usuário</th>
                      <th>Perfil</th>
                      <th>Ação</th>
                      <th>Tabela</th>
                      <th>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      const ac = getAcao(log.acao)
                      const det = log.detalhes ? (() => { try { return JSON.parse(log.detalhes) } catch { return log.detalhes } })()
                      : null
                      return (
                        <tr key={log.id}>
                          <td style={{ fontSize:'0.78rem', color:'#64748b', whiteSpace:'nowrap' }}>{formatarData(log.criado_em)}</td>
                          <td style={{ fontWeight:600 }}>{log.usuario_nome || '—'}</td>
                          <td>
                            {log.usuario_perfil && (
                              <span style={{ background:'#1e293b', color:'#94a3b8', padding:'2px 7px', borderRadius:'10px', fontSize:'0.72rem' }}>
                                {log.usuario_perfil}
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ background:ac.bg, color:ac.color, padding:'3px 9px', borderRadius:'12px', fontSize:'0.72rem', fontWeight:700 }}>
                              {ac.label}
                            </span>
                          </td>
                          <td style={{ color:'#94a3b8' }}>
                            {TABELA_EMOJI[log.tabela] || ''} {log.tabela || '—'}
                          </td>
                          <td>
                            {det ? (
                              <button
                                onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                                style={{ background:'none', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'0.78rem', padding:0 }}>
                                {expandido === log.id ? '▲ fechar' : '▼ ver'}
                              </button>
                            ) : <span style={{ color:'#475569', fontSize:'0.78rem' }}>-</span>}
                            {expandido === log.id && det && (
                              <pre style={{ marginTop:'6px', background:'#0f172a', color:'#7dd3fc', padding:'8px 10px',
                                borderRadius:'6px', fontSize:'0.72rem', maxWidth:'280px', overflowX:'auto',
                                whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
                                {JSON.stringify(det, null, 2)}
                              </pre>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }

          {/* Paginacao */}
          {totalPaginas > 1 && (
            <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginTop:'16px', alignItems:'center' }}>
              <button className='btn btn-secondary' style={{ fontSize:'0.8rem', padding:'5px 12px' }}
                disabled={page === 1} onClick={() => setPage(p => p - 1)}>◄ Anterior</button>
              <span style={{ color:'#64748b', fontSize:'0.82rem' }}>Página {page} de {totalPaginas}</span>
              <button className='btn btn-secondary' style={{ fontSize:'0.8rem', padding:'5px 12px' }}
                disabled={page >= totalPaginas} onClick={() => setPage(p => p + 1)}>Próxima ►</button>
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
