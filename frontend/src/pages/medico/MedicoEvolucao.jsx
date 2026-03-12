import { useEffect, useState, useMemo } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmModal'

const TIPO_CFG = {
  evolucao:      { cor: '#60a5fa', label: 'Evolução',       icon: '📝' },
  retorno:       { cor: '#4ade80', label: 'Retorno',         icon: '🔄' },
  procedimento:  { cor: '#f59e0b', label: 'Procedimento',    icon: '💉' },
  exame:         { cor: '#a78bfa', label: 'Exame',           icon: '🔬' },
  intercorrencia:{ cor: '#f87171', label: 'Intercorrência',  icon: '⚠️' },
}

const FORM_INICIAL = {
  paciente_id:'', consulta_id:'', tipo:'evolucao', descricao:'',
  peso:'', altura:'', pressao:'', temperatura:'', saturacao:'', glicemia:'', observacoes:'',
}

const Sinais = ({ e }) => {
  const itens = [
    e.peso        && `⚖️ ${e.peso} kg`,
    e.altura      && `📐 ${e.altura} cm`,
    e.pressao     && `🩺 ${e.pressao} mmHg`,
    e.temperatura && `🌡️ ${e.temperatura}°C`,
    e.saturacao   && `💓 ${e.saturacao}%`,
    e.glicemia    && `🩸 ${e.glicemia} mg/dL`,
  ].filter(Boolean)
  if (!itens.length) return null
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'8px' }}>
      {itens.map(i => (
        <span key={i} style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)',
          borderRadius:'20px', padding:'2px 10px', fontSize:'0.75rem', color:'#a5b4fc' }}>{i}</span>
      ))}
    </div>
  )
}

const Campo = ({ label, valor, cor = '#cbd5e1' }) => {
  if (!valor) return null
  return (
    <div style={{ marginTop:'10px' }}>
      <span style={{ fontSize:'0.72rem', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:700 }}>{label}</span>
      <p style={{ margin:'4px 0 0', color: cor, fontSize:'0.88rem', lineHeight:'1.6', whiteSpace:'pre-wrap' }}>{valor}</p>
    </div>
  )
}

export default function MedicoEvolucao() {
  const [aba,         setAba]         = useState('evolucoes') // 'evolucoes' | 'atendimentos'
  const [evolucoes,   setEvolucoes]   = useState([])
  const [prontuarios, setProntuarios] = useState([])
  const [pacientes,   setPacientes]   = useState([])
  const [consultas,   setConsultas]   = useState([])
  const [loading,     setLoading]     = useState(false)
  const [loadingPront,setLoadingPront]= useState(false)
  const [salvando,    setSalvando]    = useState(false)
  const [form,        setForm]        = useState(FORM_INICIAL)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroPac,   setFiltroPac]   = useState('')
  const [buscaAtend,  setBuscaAtend]  = useState('')
  const [expandido,   setExpandido]   = useState(null)
  const { toast, ToastUI }            = useToast()
  const { confirmar, ConfirmModalUI } = useConfirm()

  const carregar = async (paciente_id) => {
    setLoading(true)
    try {
      const params = paciente_id ? `?paciente_id=${paciente_id}` : ''
      const [re, rp, rc] = await Promise.all([
        api.get(`/evolucoes${params}`),
        api.get('/pacientes'),
        api.get('/consultas'),
      ])
      setEvolucoes(re.data || [])
      setPacientes(rp.data || [])
      setConsultas(rc.data || [])
    } finally { setLoading(false) }
  }

  const carregarProntuarios = async (paciente_id) => {
    setLoadingPront(true)
    try {
      const { data } = await api.get('/prontuarios')
      const filtrados = paciente_id
        ? (data || []).filter(p => p.paciente_id === paciente_id)
        : (data || [])
      // Ordena do mais recente
      filtrados.sort((a, b) => new Date(b.data_atendimento || b.criado_em || 0) - new Date(a.data_atendimento || a.criado_em || 0))
      setProntuarios(filtrados)
    } finally { setLoadingPront(false) }
  }

  useEffect(() => { carregar(); carregarProntuarios() }, [])

  const nomePaciente  = id => pacientes.find(p => p.id === id)?.nome || '—'

  const consultasPaciente = useMemo(() =>
    consultas.filter(c => c.paciente_id === form.paciente_id),
    [consultas, form.paciente_id]
  )

  const evolucoesFiltradas = useMemo(() => {
    if (!filtroPac) return evolucoes
    return evolucoes.filter(e => e.paciente_id === filtroPac)
  }, [evolucoes, filtroPac])

  const prontuariosFiltrados = useMemo(() => {
    let lista = prontuarios
    if (filtroPac) lista = lista.filter(p => p.paciente_id === filtroPac)
    if (buscaAtend.trim()) {
      const q = buscaAtend.toLowerCase()
      lista = lista.filter(p =>
        p.diagnostico?.toLowerCase().includes(q) ||
        p.anamnese?.toLowerCase().includes(q) ||
        p.conduta?.toLowerCase().includes(q) ||
        p.cid10?.toLowerCase().includes(q) ||
        p.prescricao?.toLowerCase().includes(q) ||
        nomePaciente(p.paciente_id).toLowerCase().includes(q)
      )
    }
    return lista
  }, [prontuarios, filtroPac, buscaAtend])

  const stats = useMemo(() => {
    const lista = filtroPac ? evolucoes.filter(e => e.paciente_id === filtroPac) : evolucoes
    const total      = lista.length
    const tipos      = Object.keys(TIPO_CFG).map(t => ({ tipo: t, qtd: lista.filter(e => e.tipo === t).length }))
    const ultPesos   = lista.filter(e => e.peso).map(e => ({ data: e.data_registro, valor: parseFloat(e.peso) })).reverse().slice(-6)
    const ultPressao = lista.filter(e => e.pressao).slice(0,1)[0]?.pressao || null
    const ultTemp    = lista.filter(e => e.temperatura).slice(0,1)[0]?.temperatura || null
    const ultSat     = lista.filter(e => e.saturacao).slice(0,1)[0]?.saturacao || null
    return { total, tipos, ultPesos, ultPressao, ultTemp, ultSat }
  }, [evolucoes, filtroPac])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handlePacienteChange = e => {
    const id = e.target.value
    setForm(prev => ({ ...prev, paciente_id: id, consulta_id: '' }))
    setFiltroPac(id)
    carregar(id || undefined)
    carregarProntuarios(id || undefined)
  }

  const handleFiltroGlobal = (id) => {
    setFiltroPac(id)
    carregar(id || undefined)
    carregarProntuarios(id || undefined)
  }

  const handleSubmit = async ev => {
    ev.preventDefault()
    if (!form.paciente_id || !form.descricao) { toast('Paciente e descrição são obrigatórios!', 'error'); return }
    setSalvando(true)
    try {
      await api.post('/evolucoes', form)
      toast('Evolução registrada!', 'success')
      setForm(FORM_INICIAL); setMostrarForm(false)
      carregar(filtroPac || undefined)
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
    finally { setSalvando(false) }
  }

  const excluir = async (id) => {
    const ok = await confirmar({ titulo: 'Excluir Evolução', mensagem: 'Deseja excluir este registro?', labelOk: 'Excluir', tipo: 'danger' })
    if (!ok) return
    try {
      await api.delete(`/evolucoes/${id}`)
      toast('Registro excluído.', 'success')
      carregar(filtroPac || undefined)
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
  }

  const card = (titulo, valor, cor, icon) => (
    <div style={{ background:'#1e293b', border:`1px solid ${cor}33`, borderRadius:'12px',
      padding:'16px 20px', flex:'1', minWidth:'140px' }}>
      <div style={{ fontSize:'1.6rem', marginBottom:'4px' }}>{icon}</div>
      <div style={{ color: cor, fontSize:'1.4rem', fontWeight:700 }}>{valor ?? '—'}</div>
      <div style={{ color:'#64748b', fontSize:'0.78rem', marginTop:'2px' }}>{titulo}</div>
    </div>
  )

  const GraficoPeso = ({ dados }) => {
    if (!dados.length) return <p style={{ color:'#475569', fontSize:'0.85rem', textAlign:'center', margin:'16px 0' }}>Nenhum registro de peso.</p>
    const max = Math.max(...dados.map(d => d.valor))
    const min = Math.min(...dados.map(d => d.valor))
    const range = max - min || 1
    const W = 340, H = 80, pad = 30
    const pts = dados.map((d, i) => ({
      x: pad + (i / Math.max(dados.length - 1, 1)) * (W - pad * 2),
      y: H - 10 - ((d.valor - min) / range) * (H - 20),
      d,
    }))
    return (
      <svg width='100%' viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow:'visible' }}>
        <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')}
          fill='none' stroke='#6366f1' strokeWidth='2.5' strokeLinejoin='round' />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r='4' fill='#6366f1' />
            <text x={p.x} y={p.y - 8} textAnchor='middle' fill='#a5b4fc' fontSize='10'>{p.d.valor}</text>
            <text x={p.x} y={H + 16} textAnchor='middle' fill='#475569' fontSize='9'>
              {new Date(p.d.data).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  // ── Estilo das abas ────────────────────────────────────────────────────────
  const tabStyle = (ativo) => ({
    padding: '8px 20px',
    border: 'none',
    borderBottom: ativo ? '2px solid #6366f1' : '2px solid transparent',
    background: 'transparent',
    color: ativo ? '#a5b4fc' : '#64748b',
    fontWeight: ativo ? 700 : 400,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  })

  return (
    <PageLayout title='📊 Evolução do Paciente'>
      <ConfirmModalUI /><ToastUI />

      {/* Toolbar global */}
      <div className='inner-toolbar' style={{ flexWrap:'wrap', gap:'10px' }}>
        <select className='form-select' style={{ maxWidth:'280px' }}
          value={filtroPac} onChange={e => handleFiltroGlobal(e.target.value)}>
          <option value=''>Todos os pacientes</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        {aba === 'evolucoes' && (
          <button className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => { setMostrarForm(!mostrarForm); if (!mostrarForm) setForm(FORM_INICIAL) }}>
            {mostrarForm ? '✖ Cancelar' : '+ Nova Evolução'}
          </button>
        )}
      </div>

      {/* Abas */}
      <div style={{ display:'flex', borderBottom:'1px solid #1e293b', marginBottom:'20px' }}>
        <button style={tabStyle(aba === 'evolucoes')}  onClick={() => { setAba('evolucoes');  setMostrarForm(false) }}>
          📝 Evoluções {filtroPac && `(${evolucoesFiltradas.length})`}
        </button>
        <button style={tabStyle(aba === 'atendimentos')} onClick={() => setAba('atendimentos')}>
          📂 Atendimentos {filtroPac && `(${prontuariosFiltrados.length})`}
        </button>
      </div>

      {/* Dashboard sinais vitais — aparece em ambas as abas quando paciente selecionado */}
      {filtroPac && (
        <div style={{ marginBottom:'24px' }}>
          <h3 style={{ color:'#94a3b8', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px' }}>
            📊 Dashboard — {nomePaciente(filtroPac)}
          </h3>
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'16px' }}>
            {card('Evoluções', stats.total, '#60a5fa', '📝')}
            {card('Atendimentos', prontuariosFiltrados.length, '#a78bfa', '📂')}
            {card('Últ. Pressão', stats.ultPressao ? `${stats.ultPressao} mmHg` : null, '#f87171', '🩺')}
            {card('Últ. Sat.', stats.ultSat ? `${stats.ultSat}%` : null, '#4ade80', '💓')}
          </div>
          {stats.tipos.filter(t => t.qtd > 0).length > 0 && (
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'16px' }}>
              {stats.tipos.filter(t => t.qtd > 0).map(t => {
                const cfg = TIPO_CFG[t.tipo]
                return (
                  <div key={t.tipo} style={{ background:'#1e293b', border:`1px solid ${cfg.cor}33`,
                    borderRadius:'8px', padding:'8px 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <span>{cfg.icon}</span>
                    <span style={{ color: cfg.cor, fontWeight:700, fontSize:'0.9rem' }}>{t.qtd}</span>
                    <span style={{ color:'#64748b', fontSize:'0.8rem' }}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          )}
          {stats.ultPesos.length > 0 && (
            <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'12px', padding:'16px 20px', marginBottom:'8px' }}>
              <div style={{ color:'#94a3b8', fontSize:'0.8rem', marginBottom:'8px' }}>⚖️ Evolução do Peso (kg)</div>
              <GraficoPeso dados={stats.ultPesos} />
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ ABA EVOLUÇÕES */}
      {aba === 'evolucoes' && (
        <>
          {mostrarForm && (
            <div className='inner-card'>
              <h3 className='inner-card-title'>Registrar Evolução</h3>
              <form onSubmit={handleSubmit} className='inner-form'>
                <div className='form-field form-field--full'>
                  <label className='form-label'>Paciente <span className='required'>*</span></label>
                  <select className='form-select' name='paciente_id' value={form.paciente_id} onChange={handlePacienteChange} required>
                    <option value=''>Selecione o paciente</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className='form-field'>
                  <label className='form-label'>Tipo</label>
                  <select className='form-select' name='tipo' value={form.tipo} onChange={handleChange}>
                    {Object.entries(TIPO_CFG).map(([v, c]) => <option key={v} value={v}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div className='form-field'>
                  <label className='form-label'>Consulta vinculada</label>
                  <select className='form-select' name='consulta_id' value={form.consulta_id} onChange={handleChange}>
                    <option value=''>Nenhuma</option>
                    {consultasPaciente.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.data_consulta ? new Date(c.data_consulta+'T12:00:00').toLocaleDateString('pt-BR') : ''} — {c.motivo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='form-field form-field--full'>
                  <label className='form-label'>Descrição / Evolução Clínica <span className='required'>*</span></label>
                  <textarea className='form-textarea' name='descricao' value={form.descricao} onChange={handleChange}
                    rows={4} placeholder='Descreva a evolução clínica do paciente...' required />
                </div>
                <div className='form-field form-field--full'>
                  <div className='form-section-divider'><span>🩺 Sinais Vitais (opcional)</span></div>
                </div>
                <div className='form-field'><label className='form-label'>Peso (kg)</label>
                  <input className='form-input' name='peso' value={form.peso} onChange={handleChange} placeholder='Ex: 72.5' type='number' step='0.1' /></div>
                <div className='form-field'><label className='form-label'>Altura (cm)</label>
                  <input className='form-input' name='altura' value={form.altura} onChange={handleChange} placeholder='Ex: 175' type='number' /></div>
                <div className='form-field'><label className='form-label'>Pressão Arterial</label>
                  <input className='form-input' name='pressao' value={form.pressao} onChange={handleChange} placeholder='Ex: 120/80' /></div>
                <div className='form-field'><label className='form-label'>Temperatura (°C)</label>
                  <input className='form-input' name='temperatura' value={form.temperatura} onChange={handleChange} placeholder='Ex: 36.5' type='number' step='0.1' /></div>
                <div className='form-field'><label className='form-label'>Saturação O₂ (%)</label>
                  <input className='form-input' name='saturacao' value={form.saturacao} onChange={handleChange} placeholder='Ex: 98' type='number' /></div>
                <div className='form-field'><label className='form-label'>Glicemia (mg/dL)</label>
                  <input className='form-input' name='glicemia' value={form.glicemia} onChange={handleChange} placeholder='Ex: 95' type='number' /></div>
                <div className='form-field form-field--full'>
                  <label className='form-label'>Observações</label>
                  <textarea className='form-textarea' name='observacoes' value={form.observacoes} onChange={handleChange} rows={2} placeholder='Observações adicionais...' />
                </div>
                <div className='form-actions'>
                  <button type='submit' className='btn btn-success' disabled={salvando}>
                    {salvando ? 'Salvando...' : '✓ Registrar Evolução'}
                  </button>
                  <button type='button' className='btn btn-secondary' onClick={() => { setMostrarForm(false); setForm(FORM_INICIAL) }}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {loading && <p className='page-loading'>Carregando...</p>}
          {!loading && (
            <>
              <h3 style={{ color:'#94a3b8', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', margin:'8px 0 16px' }}>
                🗓️ Linha do Tempo {filtroPac ? `— ${nomePaciente(filtroPac)}` : ''}
              </h3>
              {evolucoesFiltradas.length === 0 && (
                <div style={{ textAlign:'center', color:'#475569', padding:'40px' }}>
                  <div style={{ fontSize:'3rem', marginBottom:'12px' }}>📊</div>
                  <p>Nenhuma evolução registrada{filtroPac ? ' para este paciente' : ''}.</p>
                </div>
              )}
              <div style={{ position:'relative' }}>
                {evolucoesFiltradas.length > 0 && (
                  <div style={{ position:'absolute', left:'19px', top:'8px', bottom:'8px', width:'2px', background:'#1e293b', zIndex:0 }} />
                )}
                {evolucoesFiltradas.map(e => {
                  const cfg = TIPO_CFG[e.tipo] || TIPO_CFG.evolucao
                  const dataFmt = e.data_registro
                    ? new Date(e.data_registro).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
                    : '—'
                  return (
                    <div key={e.id} style={{ display:'flex', gap:'16px', marginBottom:'20px', position:'relative', zIndex:1 }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
                        background:`${cfg.cor}22`, border:`2px solid ${cfg.cor}`,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', zIndex:2 }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex:1, background:'#1e293b', border:`1px solid #334155`,
                        borderLeft:`3px solid ${cfg.cor}`, borderRadius:'10px', padding:'14px 16px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'6px' }}>
                          <div>
                            <span style={{ background:`${cfg.cor}22`, color:cfg.cor, border:`1px solid ${cfg.cor}44`,
                              borderRadius:'20px', padding:'2px 10px', fontSize:'0.72rem', fontWeight:700, marginRight:'8px' }}>
                              {cfg.icon} {cfg.label}
                            </span>
                            {!filtroPac && <span style={{ color:'#94a3b8', fontSize:'0.82rem' }}>{nomePaciente(e.paciente_id)}</span>}
                          </div>
                          <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                            <span style={{ color:'#475569', fontSize:'0.75rem' }}>{dataFmt}</span>
                            <button onClick={() => excluir(e.id)}
                              style={{ background:'transparent', border:'none', cursor:'pointer', color:'#ef4444', fontSize:'0.85rem', padding:'2px 4px' }}
                              title='Excluir'>🗑️</button>
                          </div>
                        </div>
                        <p style={{ margin:'10px 0 0', color:'#cbd5e1', fontSize:'0.9rem', lineHeight:'1.6', whiteSpace:'pre-wrap' }}>{e.descricao}</p>
                        <Sinais e={e} />
                        {e.observacoes && <p style={{ margin:'8px 0 0', color:'#64748b', fontSize:'0.82rem', fontStyle:'italic' }}>💬 {e.observacoes}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════ ABA ATENDIMENTOS */}
      {aba === 'atendimentos' && (
        <>
          {/* Barra de busca */}
          <div style={{ marginBottom:'16px' }}>
            <input className='form-input'
              placeholder='🔍 Buscar por diagnóstico, CID, anamnese, conduta, prescrição ou paciente...'
              value={buscaAtend}
              onChange={e => setBuscaAtend(e.target.value)}
              style={{ maxWidth:'520px' }}
            />
          </div>

          {loadingPront && <p className='page-loading'>Carregando atendimentos...</p>}
          {!loadingPront && (
            <>
              {prontuariosFiltrados.length === 0 && (
                <div style={{ textAlign:'center', color:'#475569', padding:'40px' }}>
                  <div style={{ fontSize:'3rem', marginBottom:'12px' }}>📂</div>
                  <p>Nenhum atendimento encontrado{filtroPac ? ' para este paciente' : ''}{buscaAtend ? ` com “${buscaAtend}”` : ''}.</p>
                </div>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {prontuariosFiltrados.map(p => {
                  const aberto    = expandido === p.id
                  const dataFmt   = p.data_atendimento
                    ? new Date(p.data_atendimento + 'T12:00:00').toLocaleDateString('pt-BR')
                    : '—'
                  return (
                    <div key={p.id} style={{ background:'#1e293b', border:'1px solid #334155',
                      borderLeft:'3px solid #6366f1', borderRadius:'10px', overflow:'hidden' }}>
                      {/* Cabeçalho clicável */}
                      <div
                        onClick={() => setExpandido(aberto ? null : p.id)}
                        style={{ padding:'14px 16px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px' }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                            <span style={{ background:'rgba(99,102,241,0.12)', color:'#a5b4fc',
                              border:'1px solid rgba(99,102,241,0.3)', borderRadius:'20px',
                              padding:'2px 10px', fontSize:'0.72rem', fontWeight:700 }}>
                              📂 Atendimento
                            </span>
                            {!filtroPac && (
                              <span style={{ color:'#e2e8f0', fontWeight:600, fontSize:'0.88rem' }}>{nomePaciente(p.paciente_id)}</span>
                            )}
                            {p.diagnostico && (
                              <span style={{ color:'#94a3b8', fontSize:'0.85rem',
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'280px' }}>
                                {p.diagnostico}
                              </span>
                            )}
                          </div>
                          <div style={{ display:'flex', gap:'12px', marginTop:'6px', flexWrap:'wrap' }}>
                            <span style={{ color:'#475569', fontSize:'0.78rem' }}>📅 {dataFmt}</span>
                            {p.cid10 && <span style={{ color:'#6366f1', fontSize:'0.78rem', fontWeight:700 }}>CID: {p.cid10}</span>}
                          </div>
                        </div>
                        <span style={{ color:'#475569', fontSize:'1rem', flexShrink:0 }}>{aberto ? '▲' : '▼'}</span>
                      </div>

                      {/* Conteúdo expandido */}
                      {aberto && (
                        <div style={{ borderTop:'1px solid #334155', padding:'16px', display:'flex', flexDirection:'column', gap:'4px' }}>
                          <Campo label='Anamnese'     valor={p.anamnese}    />
                          <Campo label='Exame Físico' valor={p.exame_fisico} />
                          <Campo label='Diagnóstico'  valor={p.diagnostico}  cor='#fbbf24' />
                          <Campo label='CID-10'       valor={p.cid10}        cor='#6366f1' />
                          <Campo label='Conduta'      valor={p.conduta}      cor='#4ade80' />
                          <Campo label='Prescrição'   valor={p.prescricao}   cor='#a5b4fc' />
                          <Campo label='Observações'  valor={p.observacoes}  />
                          {p.retorno_dias && (
                            <div style={{ marginTop:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
                              <span style={{ background:'rgba(251,191,36,0.12)', color:'#fbbf24',
                                border:'1px solid rgba(251,191,36,0.3)', borderRadius:'20px',
                                padding:'3px 12px', fontSize:'0.78rem', fontWeight:700 }}>
                                🔄 Retorno em {p.retorno_dias} dias
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </PageLayout>
  )
}
