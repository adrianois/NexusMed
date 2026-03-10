import { useEffect, useState, useCallback } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import '../InnerPage.css'

const ACOES = ['','login','login_falhou','register','criar','editar','excluir','status','esqueci_senha','resetar_senha']
const TABELAS = ['','usuarios','clinicas','medicos','pacientes','consultas','prontuarios']

const ACAO_CFG = {
  criar:         { color:'#4ade80',  bg:'rgba(34,197,94,0.12)',   label:'Criar'          },
  editar:        { color:'#60a5fa',  bg:'rgba(96,165,250,0.12)',  label:'Editar'         },
  excluir:       { color:'#f87171',  bg:'rgba(239,68,68,0.12)',   label:'Excluir'        },
  status:        { color:'#c084fc',  bg:'rgba(192,132,252,0.12)', label:'Status'         },
  login:         { color:'#94a3b8',  bg:'rgba(148,163,184,0.1)',  label:'Login'          },
  login_falhou:  { color:'#fb923c',  bg:'rgba(251,146,60,0.12)',  label:'Login Falhou'   },
  register:      { color:'#7dd3fc',  bg:'rgba(125,211,252,0.12)', label:'Registro'       },
  esqueci_senha: { color:'#fbbf24',  bg:'rgba(251,191,36,0.12)',  label:'Esqueci Senha'  },
  resetar_senha: { color:'#a78bfa',  bg:'rgba(167,139,250,0.12)', label:'Resetou Senha'  },
}

const TABELA_EMOJI = {
  usuarios:'\uD83D\uDC64', clinicas:'\uD83C\uDFE5', medicos:'\uD83D\uDC68\u200D\u2695\uFE0F',
  pacientes:'\uD83D\uDC65', consultas:'\uD83D\uDCC5', prontuarios:'\uD83D\uDCCB'
}

const CARDS_RESUMO = [
  { key:'total',   icon:'\uD83D\uDCCA', label:'Total de Registros', color:'#60a5fa'  },
  { key:'hoje',    icon:'\uD83D\uDDD3\uFE0F',  label:'Eventos Hoje',      color:'#4ade80'  },
  { key:'login',   icon:'\uD83D\uDD11',  label:'Logins',            color:'#a78bfa'  },
  { key:'excluir', icon:'\uD83D\uDDD1\uFE0F',  label:'Exclus\u00f5es',        color:'#f87171'  },
]

function BadgeAcao({ acao }) {
  const cfg = ACAO_CFG[acao] || { color:'#94a3b8', bg:'rgba(148,163,184,0.1)', label: acao }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}33`,
      padding:'3px 9px', borderRadius:'12px',
      fontSize:'0.7rem', fontWeight:700, whiteSpace:'nowrap'
    }}>{cfg.label}</span>
  )
}

export default function GestorLogs() {
  const [logs,    setLogs]    = useState([])
  const [resumo,  setResumo]  = useState({ total:0, hoje:0, acoes:{} })
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro,    setErro]    = useState(null)
  const [page,    setPage]    = useState(1)
  const [filtros, setFiltros] = useState({ acao:'', tabela:'' })
  const [expandido, setExpandido] = useState(null)

  // Carrega resumo uma vez
  useEffect(() => {
    api.get('/gestor/logs/resumo')
      .then(r => setResumo(r.data))
      .catch(() => {})
  }, [])

  const carregar = useCallback(async () => {
    setLoading(true); setErro(null)
    try {
      const p = new URLSearchParams({ page })
      if (filtros.acao)   p.append('acao',   filtros.acao)
      if (filtros.tabela) p.append('tabela', filtros.tabela)
      const { data } = await api.get(`/gestor/logs?${p}`)
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

  const fmt = iso => {
    if (!iso) return '\u2014'
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
  }

  const totalPaginas = Math.ceil(total / 50)

  const valorCard = key => {
    if (key === 'total')  return resumo.total
    if (key === 'hoje')   return resumo.hoje
    return resumo.acoes?.[key] || 0
  }

  return (
    <PageLayout title='\uD83D\uDCCB Logs da Cl\u00ednica'>

      {/* Cards de resumo */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'14px', marginBottom:'28px' }}>
        {CARDS_RESUMO.map(c => (
          <div key={c.key} style={{
            background:'linear-gradient(145deg,#111827,#0f172a)',
            border:`1px solid ${c.color}22`,
            borderTop:`3px solid ${c.color}`,
            borderRadius:'12px', padding:'18px',
            boxShadow:'0 4px 16px rgba(0,0,0,0.25)'
          }}>
            <div style={{ fontSize:'1.5rem', marginBottom:'8px' }}>{c.icon}</div>
            <div style={{ fontSize:'1.8rem', fontWeight:800, color:c.color, lineHeight:1 }}>
              {valorCard(c.key)}
            </div>
            <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:'4px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className='inner-card' style={{ padding:'16px 20px', marginBottom:'20px' }}>
        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <label className='form-label' style={{ display:'block', marginBottom:'5px' }}>Tabela</label>
            <select name='tabela' value={filtros.tabela} onChange={handleFiltro} className='form-select' style={{ minWidth:'160px' }}>
              {TABELAS.map(t => (
                <option key={t} value={t}>{t ? `${TABELA_EMOJI[t]||''} ${t}` : 'Todas as tabelas'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='form-label' style={{ display:'block', marginBottom:'5px' }}>A\u00e7\u00e3o</label>
            <select name='acao' value={filtros.acao} onChange={handleFiltro} className='form-select' style={{ minWidth:'160px' }}>
              {ACOES.map(a => (
                <option key={a} value={a}>{a ? (ACAO_CFG[a]?.label || a) : 'Todas as a\u00e7\u00f5es'}</option>
              ))}
            </select>
          </div>
          <div style={{ marginLeft:'auto', alignSelf:'center' }}>
            <span style={{ color:'#475569', fontSize:'0.8rem' }}>
              {total} registro{total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela */}
      {loading && <p className='page-loading'>\u23F3 Carregando logs...</p>}
      {erro    && <p className='page-erro'>{erro}</p>}

      {!loading && !erro && (
        logs.length === 0
          ? (
            <div className='page-vazio-box'>
              <span className='page-vazio-icon'>\uD83D\uDCCB</span>
              <p>Nenhum log encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <>
              <div className='table-wrapper'>
                <table className='data-table'>
                  <thead>
                    <tr>
                      <th>Data / Hora</th>
                      <th>Usu\u00e1rio</th>
                      <th>A\u00e7\u00e3o</th>
                      <th>Tabela</th>
                      <th>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      const det = log.detalhes
                        ? (() => { try { return JSON.parse(log.detalhes) } catch { return log.detalhes } })()
                        : null
                      return (
                        <tr key={log.id}>
                          <td style={{ fontSize:'0.78rem', color:'#475569', whiteSpace:'nowrap' }}>{fmt(log.criado_em)}</td>
                          <td>
                            <div style={{ fontWeight:600, color:'#e2e8f0', fontSize:'0.88rem' }}>{log.usuario_nome || '\u2014'}</div>
                            {log.usuario_perfil && (
                              <div style={{ fontSize:'0.68rem', color:'#475569', marginTop:'2px' }}>{log.usuario_perfil}</div>
                            )}
                          </td>
                          <td><BadgeAcao acao={log.acao} /></td>
                          <td style={{ color:'#94a3b8', fontSize:'0.85rem' }}>
                            {TABELA_EMOJI[log.tabela] || ''} {log.tabela || '\u2014'}
                          </td>
                          <td>
                            {det ? (
                              <>
                                <button
                                  onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                                  style={{ background:'none', border:'none', color:'#60a5fa', cursor:'pointer', fontSize:'0.78rem', padding:0 }}>
                                  {expandido === log.id ? '\u25B2 fechar' : '\u25BC ver'}
                                </button>
                                {expandido === log.id && (
                                  <pre style={{
                                    marginTop:'6px', background:'rgba(0,0,0,0.3)',
                                    color:'#7dd3fc', padding:'8px 10px', borderRadius:'6px',
                                    fontSize:'0.7rem', maxWidth:'260px', overflowX:'auto',
                                    whiteSpace:'pre-wrap', wordBreak:'break-all'
                                  }}>{JSON.stringify(det, null, 2)}</pre>
                                )}
                              </>
                            ) : <span style={{ color:'#334155', fontSize:'0.75rem' }}>\u2014</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagina\u00e7\u00e3o */}
              {totalPaginas > 1 && (
                <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginTop:'16px', alignItems:'center' }}>
                  <button className='btn btn-secondary' style={{ fontSize:'0.8rem', padding:'6px 14px' }}
                    disabled={page === 1} onClick={() => setPage(p => p-1)}>\u25C4 Anterior</button>
                  <span style={{ color:'#475569', fontSize:'0.82rem' }}>P\u00e1gina {page} de {totalPaginas}</span>
                  <button className='btn btn-secondary' style={{ fontSize:'0.8rem', padding:'6px 14px' }}
                    disabled={page >= totalPaginas} onClick={() => setPage(p => p+1)}>Pr\u00f3xima \u25BA</button>
                </div>
              )}
            </>
          )
      )}
    </PageLayout>
  )
}
