import { useEffect, useState, useMemo } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmModal'

const TIPO_CFG = {
  evolucao:      { cor: '#60a5fa', label: 'Evolução',      icon: '📝' },
  retorno:       { cor: '#4ade80', label: 'Retorno',        icon: '🔄' },
  procedimento:  { cor: '#f59e0b', label: 'Procedimento',   icon: '💉' },
  exame:         { cor: '#a78bfa', label: 'Exame',          icon: '🔬' },
  intercorrencia:{ cor: '#f87171', label: 'Intercorrência', icon: '⚠️' },
}

const FORM_INICIAL = {
  paciente_id:'', consulta_id:'', tipo:'evolucao', descricao:'',
  peso:'', altura:'', pressao:'', temperatura:'', saturacao:'', glicemia:'', observacoes:'',
}

// ─────────────────────────────────────────────────────────────────────────────
// Componentes auxiliares — FORA do componente principal (evita remount)
// ─────────────────────────────────────────────────────────────────────────────

function Sinais({ e }) {
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
        <span key={i} style={{
          background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)',
          borderRadius:'20px', padding:'2px 10px', fontSize:'0.75rem', color:'#a5b4fc'
        }}>{i}</span>
      ))}
    </div>
  )
}

function Campo({ label, valor, cor = '#cbd5e1' }) {
  if (!valor) return null
  return (
    <div style={{ marginTop:'10px' }}>
      <span style={{ fontSize:'0.72rem', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:700 }}>{label}</span>
      <p style={{ margin:'4px 0 0', color: cor, fontSize:'0.88rem', lineHeight:'1.6', whiteSpace:'pre-wrap' }}>{valor}</p>
    </div>
  )
}

function CardGrafico({ titulo, icon, cor, children }) {
  return (
    <div style={{ background:'#1e293b', border:`1px solid ${cor}33`, borderRadius:'14px', padding:'18px 20px', marginBottom:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
        <span style={{ fontSize:'1.1rem' }}>{icon}</span>
        <span style={{ color: cor, fontWeight:700, fontSize:'0.88rem', textTransform:'uppercase', letterSpacing:'0.8px' }}>{titulo}</span>
      </div>
      {children}
    </div>
  )
}

// Gráfico de linha SVG genérico
function GraficoLinha({ dados, cor = '#6366f1', unidade = '', vazia = 'Sem dados', labelX }) {
  if (!dados || dados.length === 0)
    return <p style={{ color:'#475569', fontSize:'0.82rem', textAlign:'center', margin:'20px 0' }}>{vazia}</p>

  const W=500, H=100, padL=44, padR=16, padT=18, padB=28
  const vals  = dados.map(d => d.valor)
  const max   = Math.max(...vals)
  const min   = Math.min(...vals)
  const range = max - min || 1
  const iW    = W - padL - padR
  const iH    = H - padT - padB
  const px    = i => padL + (i / Math.max(dados.length - 1, 1)) * iW
  const py    = v => padT + iH - ((v - min) / range) * iH
  const pts   = dados.map((d, i) => ({ x: px(i), y: py(d.valor), d }))
  const grades = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: padT + iH * (1 - f),
    v: Number.isInteger(min + range * f) ? (min + range * f).toFixed(0) : (min + range * f).toFixed(1),
  }))
  const gradId = `gl-${cor.replace('#','')}`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + padB + 10}`} style={{ overflow:'visible', display:'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={cor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={cor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {grades.map((g, i) => (
        <g key={i}>
          <line x1={padL} x2={W-padR} y1={g.y} y2={g.y} stroke="#1e293b" strokeWidth="1" />
          <text x={padL-4} y={g.y+4} textAnchor="end" fill="#475569" fontSize="9">{g.v}</text>
        </g>
      ))}
      <polygon
        points={[
          `${pts[0].x},${padT+iH}`,
          ...pts.map(p => `${p.x},${p.y}`),
          `${pts[pts.length-1].x},${padT+iH}`,
        ].join(' ')}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={pts.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill={cor} stroke="#0f172a" strokeWidth="1.5" />
          <text x={p.x} y={p.y-8} textAnchor="middle" fill={cor} fontSize="9" fontWeight="700">
            {p.d.valor}{unidade}
          </text>
          <text x={p.x} y={H+padB+6} textAnchor="middle" fill="#475569" fontSize="8">
            {p.d.label || (p.d.data ? new Date(p.d.data).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) : '')}
          </text>
        </g>
      ))}
    </svg>
  )
}

// Gráfico de barras horizontais
function GraficoBarras({ dados, corPadrao = '#6366f1' }) {
  if (!dados || dados.length === 0)
    return <p style={{ color:'#475569', fontSize:'0.82rem', textAlign:'center', margin:'20px 0' }}>Sem dados.</p>
  const max  = Math.max(...dados.map(d => d.qtd), 1)
  const W=500, barH=26, gap=8
  const totalH = dados.length * (barH + gap)
  const padL=150, padR=50

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${totalH}`} style={{ overflow:'visible', display:'block' }}>
      {dados.map((d, i) => {
        const barW = ((d.qtd / max) * (W - padL - padR)) || 0
        const y    = i * (barH + gap)
        const cor  = d.cor || corPadrao
        return (
          <g key={d.label}>
            <text x={padL-8} y={y+barH/2+4} textAnchor="end" fill="#94a3b8" fontSize="10">
              {d.icon ? `${d.icon} ` : ''}{d.label.length > 16 ? d.label.slice(0,15)+'…' : d.label}
            </text>
            <rect x={padL} y={y} width={W-padL-padR} height={barH} fill="#0f172a" rx="5" />
            {barW > 0 && <rect x={padL} y={y} width={barW} height={barH} fill={cor} rx="5" opacity="0.85" />}
            <text x={padL+barW+6} y={y+barH/2+4} fill={d.qtd>0 ? cor : '#475569'} fontSize="11" fontWeight="700">
              {d.qtd}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Gráfico de pressão
function GraficoPressao({ dados }) {
  if (!dados || dados.length === 0)
    return <p style={{ color:'#475569', fontSize:'0.82rem', textAlign:'center', margin:'20px 0' }}>Sem dados de pressão arterial.</p>

  const W=500, H=100, padL=44, padR=16, padT=18, padB=40
  const allVals = dados.flatMap(d => [d.sistolica, d.diastolica])
  const maxV = Math.max(...allVals) + 10
  const minV = Math.min(...allVals) - 10
  const range = maxV - minV || 1
  const iW = W-padL-padR, iH = H-padT-padB+padB/2
  const px  = i => padL + (i / Math.max(dados.length-1, 1)) * iW
  const py  = v => padT + iH - ((v-minV)/range)*iH
  const grades = [0, 0.5, 1].map(f => ({ y: padT+iH*(1-f), v: Math.round(minV+range*f) }))

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H+padB}`} style={{ overflow:'visible', display:'block' }}>
      {grades.map((g,i) => (
        <g key={i}>
          <line x1={padL} x2={W-padR} y1={g.y} y2={g.y} stroke="#1e293b" strokeWidth="1"/>
          <text x={padL-4} y={g.y+4} textAnchor="end" fill="#475569" fontSize="9">{g.v}</text>
        </g>
      ))}
      <polyline points={dados.map((d,i)=>`${px(i)},${py(d.sistolica)}`).join(' ')}
        fill="none" stroke="#f87171" strokeWidth="2" strokeLinejoin="round"/>
      <polyline points={dados.map((d,i)=>`${px(i)},${py(d.diastolica)}`).join(' ')}
        fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round"/>
      {dados.map((d,i)=>(
        <g key={i}>
          <circle cx={px(i)} cy={py(d.sistolica)}  r="3.5" fill="#f87171" stroke="#0f172a" strokeWidth="1.5"/>
          <text x={px(i)} y={py(d.sistolica)-7} textAnchor="middle" fill="#f87171" fontSize="8">{d.sistolica}</text>
          <circle cx={px(i)} cy={py(d.diastolica)} r="3.5" fill="#60a5fa" stroke="#0f172a" strokeWidth="1.5"/>
          <text x={px(i)} y={py(d.diastolica)-7} textAnchor="middle" fill="#60a5fa" fontSize="8">{d.diastolica}</text>
          <text x={px(i)} y={H+padB-4} textAnchor="middle" fill="#475569" fontSize="8">
            {new Date(d.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
          </text>
        </g>
      ))}
      <circle cx={padL}    cy={H+padB-14} r="4" fill="#f87171"/>
      <text x={padL+8}    y={H+padB-10} fill="#f87171" fontSize="9">Sistólica</text>
      <circle cx={padL+70} cy={H+padB-14} r="4" fill="#60a5fa"/>
      <text x={padL+78}   y={H+padB-10} fill="#60a5fa" fontSize="9">Diastólica</text>
    </svg>
  )
}

function agruparPorPaciente(lista, nomeFallback) {
  const mapa = {}
  lista.forEach(item => {
    const pid = item.paciente_id
    if (!mapa[pid]) mapa[pid] = {
      paciente_id: pid,
      nome: item.paciente_nome || item.paciente?.nome || nomeFallback(pid),
      registros: [],
    }
    mapa[pid].registros.push(item)
  })
  return Object.values(mapa)
}

// Paleta de cores para CIDs
const PALETA = ['#6366f1','#f59e0b','#4ade80','#f87171','#a78bfa','#38bdf8','#fb923c','#34d399','#e879f9','#fbbf24']

// ─────────────────────────────────────────────────────────────────────────────
export default function MedicoEvolucao() {
  const [aba,              setAba]              = useState('evolucoes')
  const [subAbaAtend,      setSubAbaAtend]      = useState('lista')
  const [evolucoes,        setEvolucoes]        = useState([])
  const [prontuarios,      setProntuarios]      = useState([])
  const [pacientes,        setPacientes]        = useState([])
  const [consultas,        setConsultas]        = useState([])
  const [loading,          setLoading]          = useState(false)
  const [loadingPront,     setLoadingPront]     = useState(false)
  const [salvando,         setSalvando]         = useState(false)
  const [form,             setForm]             = useState(FORM_INICIAL)
  const [mostrarForm,      setMostrarForm]      = useState(false)
  const [filtroPac,        setFiltroPac]        = useState('')
  const [buscaAtend,       setBuscaAtend]       = useState('')
  const [expandidoPac,     setExpandidoPac]     = useState({})
  const [expandidoItem,    setExpandidoItem]    = useState(null)
  const { toast, ToastUI }                     = useToast()
  const { confirmar, ConfirmModalUI }          = useConfirm()

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
      let lista = data || []
      if (paciente_id) lista = lista.filter(p => p.paciente_id === paciente_id)
      lista.sort((a, b) => new Date(b.data_atendimento || 0) - new Date(a.data_atendimento || 0))
      setProntuarios(lista)
    } finally { setLoadingPront(false) }
  }

  useEffect(() => { carregar(); carregarProntuarios() }, [])

  const nomePaciente = id => pacientes.find(p => p.id === id)?.nome || id || '—'

  const consultasPaciente = useMemo(() =>
    consultas.filter(c => c.paciente_id === form.paciente_id),
    [consultas, form.paciente_id]
  )

  const evolucoesFiltradas = useMemo(() =>
    filtroPac ? evolucoes.filter(e => e.paciente_id === filtroPac) : evolucoes,
    [evolucoes, filtroPac]
  )

  const prontuariosFiltrados = useMemo(() => {
    let lista = filtroPac ? prontuarios.filter(p => p.paciente_id === filtroPac) : prontuarios
    if (buscaAtend.trim()) {
      const q = buscaAtend.toLowerCase()
      lista = lista.filter(p =>
        p.diagnostico?.toLowerCase().includes(q) ||
        p.anamnese?.toLowerCase().includes(q) ||
        p.conduta?.toLowerCase().includes(q) ||
        p.cid10?.toLowerCase().includes(q) ||
        p.prescricao?.toLowerCase().includes(q) ||
        (p.paciente_nome || nomePaciente(p.paciente_id)).toLowerCase().includes(q)
      )
    }
    return lista
  }, [prontuarios, filtroPac, buscaAtend, pacientes])

  const gruposEvolucoes   = useMemo(() => agruparPorPaciente(evolucoesFiltradas,  nomePaciente), [evolucoesFiltradas, pacientes])
  const gruposProntuarios = useMemo(() => agruparPorPaciente(prontuariosFiltrados, nomePaciente), [prontuariosFiltrados, pacientes])

  // ─ dados gráficos das EVOLUÇÕES (sinais vitais)
  const dadosGraficos = useMemo(() => {
    const base     = filtroPac ? evolucoes.filter(e => e.paciente_id === filtroPac) : evolucoes
    const ordenado = [...base].sort((a, b) => new Date(a.data_registro) - new Date(b.data_registro))
    const peso     = ordenado.filter(e => e.peso        != null && e.peso        !== '').map(e => ({ data: e.data_registro, valor: parseFloat(e.peso) }))
    const temp     = ordenado.filter(e => e.temperatura != null && e.temperatura !== '').map(e => ({ data: e.data_registro, valor: parseFloat(e.temperatura) }))
    const sat      = ordenado.filter(e => e.saturacao   != null && e.saturacao   !== '').map(e => ({ data: e.data_registro, valor: parseFloat(e.saturacao) }))
    const glicemia = ordenado.filter(e => e.glicemia    != null && e.glicemia    !== '').map(e => ({ data: e.data_registro, valor: parseFloat(e.glicemia) }))
    const pressao  = ordenado
      .filter(e => e.pressao && String(e.pressao).includes('/'))
      .map(e => {
        const [s, d] = String(e.pressao).split('/').map(Number)
        return (!isNaN(s) && !isNaN(d)) ? { data: e.data_registro, sistolica: s, diastolica: d } : null
      }).filter(Boolean)
    const tiposBar = Object.entries(TIPO_CFG).map(([tipo, cfg]) => ({
      label: cfg.label, icon: cfg.icon, cor: cfg.cor,
      qtd: base.filter(e => e.tipo === tipo).length,
    }))
    return { peso, temp, sat, glicemia, pressao, tiposBar, total: base.length }
  }, [evolucoes, filtroPac])

  // ─ dados gráficos dos ATENDIMENTOS / PRONTUÁRIOS
  const dadosGraficosAtend = useMemo(() => {
    const base = filtroPac
      ? prontuarios.filter(p => p.paciente_id === filtroPac)
      : prontuarios

    // 1) Atendimentos por mês (linha)
    const porMes = {}
    base.forEach(p => {
      if (!p.data_atendimento) return
      const d   = new Date(p.data_atendimento + 'T12:00:00')
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      porMes[key] = (porMes[key] || 0) + 1
    })
    const atendPorMes = Object.keys(porMes).sort().map(k => ({
      label: k.slice(5) + '/' + k.slice(2,4),
      valor: porMes[k],
    }))

    // 2) Top 10 CIDs (barras)
    const cidMap = {}
    base.forEach(p => {
      if (!p.cid10) return
      const cid = p.cid10.trim().toUpperCase()
      cidMap[cid] = (cidMap[cid] || 0) + 1
    })
    const topCids = Object.entries(cidMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, qtd], i) => ({ label, qtd, cor: PALETA[i % PALETA.length] }))

    // 3) Diagnósticos mais frequentes (barras, top 8)
    const diagMap = {}
    base.forEach(p => {
      if (!p.diagnostico) return
      const diag = p.diagnostico.trim()
      diagMap[diag] = (diagMap[diag] || 0) + 1
    })
    const topDiag = Object.entries(diagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, qtd], i) => ({ label, qtd, cor: PALETA[i % PALETA.length] }))

    // 4) Distribuição de retorno (barras: semanas)
    const retornoMap = { '1 semana':0, '2 semanas':0, '3 semanas':0, '1 mês':0, '2 meses':0, '3+ meses':0, 'Sem retorno':0 }
    base.forEach(p => {
      const dias = parseInt(p.retorno_dias || 0)
      if (!dias)                retornoMap['Sem retorno']++
      else if (dias <= 7)       retornoMap['1 semana']++
      else if (dias <= 14)      retornoMap['2 semanas']++
      else if (dias <= 21)      retornoMap['3 semanas']++
      else if (dias <= 30)      retornoMap['1 mês']++
      else if (dias <= 60)      retornoMap['2 meses']++
      else                      retornoMap['3+ meses']++
    })
    const retornoBars = Object.entries(retornoMap)
      .map(([label, qtd], i) => ({ label, qtd, cor: PALETA[i % PALETA.length] }))
      .filter(d => d.qtd > 0)

    // 5) Pacientes com mais atendimentos (apenas sem filtro de paciente)
    const pacMap = {}
    if (!filtroPac) {
      base.forEach(p => {
        const pid  = p.paciente_id
        const nome = p.paciente_nome || pid
        pacMap[nome] = (pacMap[nome] || 0) + 1
      })
    }
    const topPac = Object.entries(pacMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, qtd], i) => ({ label, qtd, cor: PALETA[i % PALETA.length] }))

    return { atendPorMes, topCids, topDiag, retornoBars, topPac, total: base.length }
  }, [prontuarios, filtroPac])

  const stats = useMemo(() => {
    const lista = filtroPac ? evolucoes.filter(e => e.paciente_id === filtroPac) : evolucoes
    return {
      total:      lista.length,
      ultPressao: lista.find(e => e.pressao)?.pressao || null,
      ultSat:     lista.find(e => e.saturacao)?.saturacao || null,
    }
  }, [evolucoes, filtroPac])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handlePacienteChange = e => {
    const id = e.target.value
    setForm(prev => ({ ...prev, paciente_id: id, consulta_id: '' }))
    setFiltroPac(id)
    carregar(id || undefined)
    carregarProntuarios(id || undefined)
  }

  const handleFiltroGlobal = id => {
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

  const excluir = async id => {
    const ok = await confirmar({ titulo: 'Excluir Evolução', mensagem: 'Deseja excluir este registro?', labelOk: 'Excluir', tipo: 'danger' })
    if (!ok) return
    try {
      await api.delete(`/evolucoes/${id}`)
      toast('Registro excluído.', 'success')
      carregar(filtroPac || undefined)
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
  }

  const togglePac = pid => setExpandidoPac(prev => ({ ...prev, [pid]: !prev[pid] }))

  const card = (titulo, valor, cor, icon) => (
    <div style={{ background:'#1e293b', border:`1px solid ${cor}33`, borderRadius:'12px', padding:'16px 20px', flex:'1', minWidth:'140px' }}>
      <div style={{ fontSize:'1.6rem', marginBottom:'4px' }}>{icon}</div>
      <div style={{ color: cor, fontSize:'1.4rem', fontWeight:700 }}>{valor ?? '—'}</div>
      <div style={{ color:'#64748b', fontSize:'0.78rem', marginTop:'2px' }}>{titulo}</div>
    </div>
  )

  const tabStyle = ativo => ({
    padding:'8px 20px', border:'none',
    borderBottom: ativo ? '2px solid #6366f1' : '2px solid transparent',
    background:'transparent', color: ativo ? '#a5b4fc' : '#64748b',
    fontWeight: ativo ? 700 : 400, cursor:'pointer', fontSize:'0.9rem',
    fontFamily:'inherit', transition:'all 0.2s',
  })

  const subTabStyle = ativo => ({
    padding:'6px 16px', border:'none',
    borderBottom: ativo ? '2px solid #a78bfa' : '2px solid transparent',
    background:'transparent', color: ativo ? '#c4b5fd' : '#64748b',
    fontWeight: ativo ? 700 : 400, cursor:'pointer', fontSize:'0.82rem',
    fontFamily:'inherit', transition:'all 0.2s',
  })

  const CabecalhoPaciente = ({ pid, nome, qtd, corBorda = '#6366f1', badge }) => {
    const aberto = expandidoPac[pid] !== false
    return (
      <div onClick={() => togglePac(pid)} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'#0f172a', border:`1px solid ${corBorda}44`,
        borderLeft:`4px solid ${corBorda}`, borderRadius:'10px',
        padding:'12px 18px', cursor:'pointer',
        borderBottomLeftRadius: aberto ? '0' : '10px',
        borderBottomRightRadius: aberto ? '0' : '10px',
        marginBottom: aberto ? '0' : '4px',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'1.4rem' }}>👤</span>
          <div>
            <span style={{ color:'#e2e8f0', fontWeight:700, fontSize:'0.95rem' }}>{nome}</span>
            {badge && <span style={{ marginLeft:'10px', color:'#64748b', fontSize:'0.78rem' }}>{badge}</span>}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ background:`${corBorda}22`, color:corBorda, border:`1px solid ${corBorda}44`,
            borderRadius:'20px', padding:'2px 12px', fontSize:'0.78rem', fontWeight:700 }}>
            {qtd} registro{qtd !== 1 ? 's' : ''}
          </span>
          <span style={{ color:'#475569' }}>{aberto ? '▲' : '▼'}</span>
        </div>
      </div>
    )
  }

  return (
    <PageLayout title='📊 Evolução do Paciente'>
      <ConfirmModalUI /><ToastUI />

      {/* Toolbar */}
      <div className="inner-toolbar" style={{ flexWrap:'wrap', gap:'10px' }}>
        <select className="form-select" style={{ maxWidth:'280px' }}
          value={filtroPac} onChange={e => handleFiltroGlobal(e.target.value)}>
          <option value="">Todos os pacientes</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        {aba === 'evolucoes' && (
          <button className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => { setMostrarForm(!mostrarForm); if (!mostrarForm) setForm(FORM_INICIAL) }}>
            {mostrarForm ? '✖ Cancelar' : '+ Nova Evolução'}
          </button>
        )}
      </div>

      {/* Abas principais */}
      <div style={{ display:'flex', borderBottom:'1px solid #1e293b', marginBottom:'20px' }}>
        <button style={tabStyle(aba==='evolucoes')} onClick={() => { setAba('evolucoes'); setMostrarForm(false) }}>
          📝 Evoluções
        </button>
        <button style={tabStyle(aba==='atendimentos')} onClick={() => setAba('atendimentos')}>
          📂 Atendimentos
        </button>
        <button style={tabStyle(aba==='graficos')} onClick={() => setAba('graficos')}>
          📈 Gráficos {filtroPac && dadosGraficos.total > 0 ? `(${dadosGraficos.total})` : ''}
        </button>
      </div>

      {/* Cards resumo */}
      {filtroPac && (
        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'20px' }}>
          {card('Evoluções',    stats.total,                  '#60a5fa', '📝')}
          {card('Atendimentos', prontuariosFiltrados.length,   '#a78bfa', '📂')}
          {card('Últ. Pressão',  stats.ultPressao || null,      '#f87171', '🩺')}
          {card('Últ. Sat.',     stats.ultSat ? `${stats.ultSat}%` : null, '#4ade80', '💓')}
        </div>
      )}

      {/* ══ ABA EVOLUÇÕES ══════════════════════════════════ */}
      {aba === 'evolucoes' && (
        <>
          {mostrarForm && (
            <div className="inner-card" style={{ marginBottom:'24px' }}>
              <h3 className="inner-card-title">Registrar Evolução</h3>
              <form onSubmit={handleSubmit} className="inner-form">
                <div className="form-field form-field--full">
                  <label className="form-label">Paciente <span className="required">*</span></label>
                  <select className="form-select" name="paciente_id" value={form.paciente_id} onChange={handlePacienteChange} required>
                    <option value="">Selecione o paciente</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" name="tipo" value={form.tipo} onChange={handleChange}>
                    {Object.entries(TIPO_CFG).map(([v,c]) => <option key={v} value={v}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Consulta vinculada</label>
                  <select className="form-select" name="consulta_id" value={form.consulta_id} onChange={handleChange}>
                    <option value="">Nenhuma</option>
                    {consultasPaciente.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.data_consulta ? new Date(c.data_consulta+'T12:00:00').toLocaleDateString('pt-BR') : ''} — {c.motivo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field form-field--full">
                  <label className="form-label">Descrição / Evolução Clínica <span className="required">*</span></label>
                  <textarea className="form-textarea" name="descricao" value={form.descricao} onChange={handleChange} rows={4} placeholder="Descreva a evolução clínica..." required />
                </div>
                <div className="form-field form-field--full">
                  <div className="form-section-divider"><span>🩺 Sinais Vitais (opcional)</span></div>
                </div>
                <div className="form-field"><label className="form-label">Peso (kg)</label>
                  <input className="form-input" name="peso" value={form.peso} onChange={handleChange} placeholder="Ex: 72.5" type="number" step="0.1" /></div>
                <div className="form-field"><label className="form-label">Altura (cm)</label>
                  <input className="form-input" name="altura" value={form.altura} onChange={handleChange} placeholder="Ex: 175" type="number" /></div>
                <div className="form-field"><label className="form-label">Pressão Arterial</label>
                  <input className="form-input" name="pressao" value={form.pressao} onChange={handleChange} placeholder="Ex: 120/80" /></div>
                <div className="form-field"><label className="form-label">Temperatura (°C)</label>
                  <input className="form-input" name="temperatura" value={form.temperatura} onChange={handleChange} placeholder="Ex: 36.5" type="number" step="0.1" /></div>
                <div className="form-field"><label className="form-label">Saturação O₂ (%)</label>
                  <input className="form-input" name="saturacao" value={form.saturacao} onChange={handleChange} placeholder="Ex: 98" type="number" /></div>
                <div className="form-field"><label className="form-label">Glicemia (mg/dL)</label>
                  <input className="form-input" name="glicemia" value={form.glicemia} onChange={handleChange} placeholder="Ex: 95" type="number" /></div>
                <div className="form-field form-field--full">
                  <label className="form-label">Observações</label>
                  <textarea className="form-textarea" name="observacoes" value={form.observacoes} onChange={handleChange} rows={2} placeholder="Observações adicionais..." />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-success" disabled={salvando}>{salvando ? 'Salvando...' : '✓ Registrar Evolução'}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setMostrarForm(false); setForm(FORM_INICIAL) }}>Cancelar</button>
                </div>
              </form>
            </div>
          )}
          {loading && <p className="page-loading">Carregando...</p>}
          {!loading && (
            <>
              {gruposEvolucoes.length === 0 && (
                <div style={{ textAlign:'center', color:'#475569', padding:'40px' }}>
                  <div style={{ fontSize:'3rem', marginBottom:'12px' }}>📊</div>
                  <p>Nenhuma evolução registrada{filtroPac ? ' para este paciente' : ''}.</p>
                </div>
              )}
              {gruposEvolucoes.map(({ paciente_id: pid, nome, registros }) => {
                const aberto  = expandidoPac[pid] !== false
                const ultData = registros[0]?.data_registro
                  ? new Date(registros[0].data_registro).toLocaleDateString('pt-BR') : null
                return (
                  <div key={pid} style={{ marginBottom:'16px' }}>
                    <CabecalhoPaciente pid={pid} nome={nome} qtd={registros.length} corBorda="#60a5fa"
                      badge={ultData ? `Último: ${ultData}` : undefined} />
                    {aberto && (
                      <div style={{ border:'1px solid #1e293b', borderTop:'none',
                        borderBottomLeftRadius:'10px', borderBottomRightRadius:'10px',
                        padding:'16px', background:'#0a111e', position:'relative' }}>
                        <div style={{ position:'absolute', left:'35px', top:'8px', bottom:'8px', width:'2px', background:'#1e293b' }} />
                        {registros.map(e => {
                          const cfg = TIPO_CFG[e.tipo] || TIPO_CFG.evolucao
                          const dataFmt = e.data_registro
                            ? new Date(e.data_registro).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})
                            : '—'
                          return (
                            <div key={e.id} style={{ display:'flex', gap:'16px', marginBottom:'16px', position:'relative', zIndex:1 }}>
                              <div style={{ width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
                                background:`${cfg.cor}22`, border:`2px solid ${cfg.cor}`,
                                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', zIndex:2 }}>{cfg.icon}</div>
                              <div style={{ flex:1, background:'#1e293b', border:'1px solid #334155',
                                borderLeft:`3px solid ${cfg.cor}`, borderRadius:'10px', padding:'12px 16px' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'6px' }}>
                                  <span style={{ background:`${cfg.cor}22`, color:cfg.cor, border:`1px solid ${cfg.cor}44`,
                                    borderRadius:'20px', padding:'2px 10px', fontSize:'0.72rem', fontWeight:700 }}>
                                    {cfg.icon} {cfg.label}
                                  </span>
                                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                                    <span style={{ color:'#475569', fontSize:'0.75rem' }}>{dataFmt}</span>
                                    <button onClick={() => excluir(e.id)}
                                      style={{ background:'transparent', border:'none', cursor:'pointer', color:'#ef4444', padding:'2px 4px' }}
                                      title="Excluir">🗑️</button>
                                  </div>
                                </div>
                                <p style={{ margin:'8px 0 0', color:'#cbd5e1', fontSize:'0.88rem', lineHeight:'1.6', whiteSpace:'pre-wrap' }}>{e.descricao}</p>
                                <Sinais e={e} />
                                {e.observacoes && <p style={{ margin:'6px 0 0', color:'#64748b', fontSize:'0.8rem', fontStyle:'italic' }}>💬 {e.observacoes}</p>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </>
      )}

      {/* ══ ABA ATENDIMENTOS ══════════════════════════════ */}
      {aba === 'atendimentos' && (
        <div>
          {/* Sub-abas: Lista | Gráficos */}
          <div style={{ display:'flex', borderBottom:'1px solid #1e293b', marginBottom:'16px', gap:'4px' }}>
            <button style={subTabStyle(subAbaAtend==='lista')} onClick={() => setSubAbaAtend('lista')}>
              📄 Lista de Atendimentos
            </button>
            <button style={subTabStyle(subAbaAtend==='graficos')} onClick={() => setSubAbaAtend('graficos')}>
              📈 Gráficos {dadosGraficosAtend.total > 0 ? `(${dadosGraficosAtend.total})` : ''}
            </button>
          </div>

          {/* ─ SUB-ABA LISTA ─ */}
          {subAbaAtend === 'lista' && (
            <>
              <div style={{ marginBottom:'16px' }}>
                <input className="form-input"
                  placeholder="🔍 Buscar por diagnóstico, CID, anamnese, conduta, prescrição ou paciente..."
                  value={buscaAtend} onChange={e => setBuscaAtend(e.target.value)}
                  style={{ maxWidth:'520px' }}
                />
              </div>
              {loadingPront && <p className="page-loading">Carregando atendimentos...</p>}
              {!loadingPront && (
                <>
                  {gruposProntuarios.length === 0 && (
                    <div style={{ textAlign:'center', color:'#475569', padding:'40px' }}>
                      <div style={{ fontSize:'3rem', marginBottom:'12px' }}>📂</div>
                      <p>Nenhum atendimento encontrado{filtroPac ? ' para este paciente' : ''}{buscaAtend ? ` com “${buscaAtend}”` : ''}.</p>
                    </div>
                  )}
                  {gruposProntuarios.map(({ paciente_id: pid, nome, registros }) => {
                    const aberto  = expandidoPac[pid] !== false
                    const ultData = registros[0]?.data_atendimento
                      ? new Date(registros[0].data_atendimento+'T12:00:00').toLocaleDateString('pt-BR') : null
                    return (
                      <div key={pid} style={{ marginBottom:'16px' }}>
                        <CabecalhoPaciente pid={pid} nome={nome} qtd={registros.length} corBorda="#6366f1"
                          badge={ultData ? `Último: ${ultData}` : undefined} />
                        {aberto && (
                          <div style={{ border:'1px solid #1e293b', borderTop:'none',
                            borderBottomLeftRadius:'10px', borderBottomRightRadius:'10px',
                            padding:'12px', background:'#0a111e',
                            display:'flex', flexDirection:'column', gap:'8px' }}>
                            {registros.map(p => {
                              const itemAberto = expandidoItem === p.id
                              const dataFmt = p.data_atendimento
                                ? new Date(p.data_atendimento+'T12:00:00').toLocaleDateString('pt-BR') : '—'
                              return (
                                <div key={p.id} style={{ background:'#1e293b', border:'1px solid #334155',
                                  borderLeft:'3px solid #6366f1', borderRadius:'8px', overflow:'hidden' }}>
                                  <div onClick={() => setExpandidoItem(itemAberto ? null : p.id)}
                                    style={{ padding:'12px 16px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px' }}>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                                        <span style={{ color:'#a5b4fc', fontSize:'0.78rem', fontWeight:700 }}>📅 {dataFmt}</span>
                                        {p.cid10 && <span style={{ color:'#6366f1', fontSize:'0.78rem', fontWeight:700,
                                          background:'rgba(99,102,241,0.12)', padding:'1px 8px', borderRadius:'12px' }}>CID {p.cid10}</span>}
                                        {p.diagnostico && (
                                          <span style={{ color:'#94a3b8', fontSize:'0.84rem',
                                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'260px' }}>
                                            {p.diagnostico}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span style={{ color:'#475569', flexShrink:0 }}>{itemAberto ? '▲' : '▼'}</span>
                                  </div>
                                  {itemAberto && (
                                    <div style={{ borderTop:'1px solid #334155', padding:'14px 16px', display:'flex', flexDirection:'column', gap:'4px' }}>
                                      <Campo label="Anamnese"     valor={p.anamnese}    />
                                      <Campo label="Exame Físico" valor={p.exame_fisico} />
                                      <Campo label="Diagnóstico"  valor={p.diagnostico}  cor="#fbbf24" />
                                      <Campo label="CID-10"       valor={p.cid10}        cor="#6366f1" />
                                      <Campo label="Conduta"      valor={p.conduta}      cor="#4ade80" />
                                      <Campo label="Prescrição"   valor={p.prescricao}   cor="#a5b4fc" />
                                      <Campo label="Observações"  valor={p.observacoes}  />
                                      {p.retorno_dias && (
                                        <div style={{ marginTop:'10px' }}>
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
                        )}
                      </div>
                    )
                  })}
                </>
              )}
            </>
          )}

          {/* ─ SUB-ABA GRÁFICOS DE ATENDIMENTOS ─ */}
          {subAbaAtend === 'graficos' && (
            <div>
              {dadosGraficosAtend.total === 0 ? (
                <div style={{ textAlign:'center', color:'#475569', padding:'48px 20px' }}>
                  <div style={{ fontSize:'3rem', marginBottom:'12px' }}>📈</div>
                  <p>Nenhum atendimento encontrado{filtroPac ? ' para este paciente' : ''}.</p>
                </div>
              ) : (
                <>
                  {/* cabeçalho resumo */}
                  <p style={{ color:'#64748b', fontSize:'0.82rem', marginBottom:'20px' }}>
                    {filtroPac
                      ? <><strong style={{ color:'#e2e8f0' }}>{nomePaciente(filtroPac)}</strong> — {dadosGraficosAtend.total} atendimento{dadosGraficosAtend.total !== 1 ? 's' : ''}</>
                      : <>{dadosGraficosAtend.total} atendimentos no total</>}
                  </p>

                  {/* Linha: Atendimentos por mês */}
                  <CardGrafico titulo="Atendimentos por Mês" icon="📅" cor="#6366f1">
                    <GraficoLinha
                      dados={dadosGraficosAtend.atendPorMes}
                      cor="#6366f1"
                      vazia="Sem datas de atendimento registradas."
                    />
                    {dadosGraficosAtend.atendPorMes.length > 0 && (
                      <div style={{ display:'flex', gap:'16px', marginTop:'8px', fontSize:'0.78rem', color:'#64748b' }}>
                        <span>Total <strong style={{ color:'#a5b4fc' }}>{dadosGraficosAtend.total}</strong></span>
                        <span>Período <strong style={{ color:'#a5b4fc' }}>
                          {dadosGraficosAtend.atendPorMes[0]?.label} — {dadosGraficosAtend.atendPorMes.at(-1)?.label}
                        </strong></span>
                      </div>
                    )}
                  </CardGrafico>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'16px' }}>

                    {/* CIDs mais frequentes */}
                    <CardGrafico titulo="CIDs mais Frequentes" icon="🩺" cor="#f87171">
                      {dadosGraficosAtend.topCids.length === 0
                        ? <p style={{ color:'#475569', fontSize:'0.82rem', textAlign:'center', margin:'20px 0' }}>Sem CIDs cadastrados.</p>
                        : <GraficoBarras dados={dadosGraficosAtend.topCids} />
                      }
                    </CardGrafico>

                    {/* Diagnósticos mais frequentes */}
                    <CardGrafico titulo="Diagnósticos Frequentes" icon="📌" cor="#f59e0b">
                      {dadosGraficosAtend.topDiag.length === 0
                        ? <p style={{ color:'#475569', fontSize:'0.82rem', textAlign:'center', margin:'20px 0' }}>Sem diagnósticos cadastrados.</p>
                        : <GraficoBarras dados={dadosGraficosAtend.topDiag} corPadrao="#f59e0b" />
                      }
                    </CardGrafico>

                    {/* Distribuição de retorno */}
                    <CardGrafico titulo="Prazo de Retorno" icon="🔄" cor="#4ade80">
                      {dadosGraficosAtend.retornoBars.length === 0
                        ? <p style={{ color:'#475569', fontSize:'0.82rem', textAlign:'center', margin:'20px 0' }}>Sem dados de retorno.</p>
                        : <GraficoBarras dados={dadosGraficosAtend.retornoBars} corPadrao="#4ade80" />
                      }
                    </CardGrafico>

                    {/* Pacientes com mais atendimentos (só sem filtro de paciente) */}
                    {!filtroPac && dadosGraficosAtend.topPac.length > 0 && (
                      <CardGrafico titulo="Pacientes com Mais Atendimentos" icon="👥" cor="#a78bfa">
                        <GraficoBarras dados={dadosGraficosAtend.topPac} corPadrao="#a78bfa" />
                      </CardGrafico>
                    )}

                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ ABA GRÁFICOS (sinais vitais de evoluções) ════════════════ */}
      {aba === 'graficos' && (
        <div>
          {!filtroPac && (
            <div style={{ textAlign:'center', color:'#475569', padding:'48px 20px' }}>
              <div style={{ fontSize:'3rem', marginBottom:'12px' }}>📈</div>
              <p style={{ fontSize:'0.95rem' }}>
                Selecione um <strong style={{ color:'#a5b4fc' }}>paciente</strong> no filtro acima para visualizar os gráficos.
              </p>
            </div>
          )}
          {filtroPac && dadosGraficos.total === 0 && (
            <div style={{ textAlign:'center', color:'#475569', padding:'48px 20px' }}>
              <div style={{ fontSize:'3rem', marginBottom:'12px' }}>📈</div>
              <p>Nenhuma evolução registrada para <strong style={{ color:'#a5b4fc' }}>{nomePaciente(filtroPac)}</strong>.</p>
            </div>
          )}
          {filtroPac && dadosGraficos.total > 0 && (
            <div>
              <p style={{ color:'#64748b', fontSize:'0.82rem', marginBottom:'20px' }}>
                Evolução clínica de <strong style={{ color:'#e2e8f0' }}>{nomePaciente(filtroPac)}</strong>
                {' '}— {dadosGraficos.total} registro{dadosGraficos.total !== 1 ? 's' : ''}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'16px' }}>
                <CardGrafico titulo="Peso Corporal (kg)" icon="⚖️" cor="#6366f1">
                  <GraficoLinha dados={dadosGraficos.peso} cor="#6366f1" vazia="Sem registros de peso." />
                  {dadosGraficos.peso.length > 0 && (
                    <div style={{ display:'flex', gap:'16px', marginTop:'8px', fontSize:'0.78rem', color:'#64748b' }}>
                      <span>Mín <strong style={{ color:'#a5b4fc' }}>{Math.min(...dadosGraficos.peso.map(d=>d.valor))} kg</strong></span>
                      <span>Máx <strong style={{ color:'#a5b4fc' }}>{Math.max(...dadosGraficos.peso.map(d=>d.valor))} kg</strong></span>
                      <span>Últ <strong style={{ color:'#a5b4fc' }}>{dadosGraficos.peso.at(-1).valor} kg</strong></span>
                    </div>
                  )}
                </CardGrafico>
                <CardGrafico titulo="Temperatura (°C)" icon="🌡️" cor="#f59e0b">
                  <GraficoLinha dados={dadosGraficos.temp} cor="#f59e0b" unidade="°" vazia="Sem registros de temperatura." />
                  {dadosGraficos.temp.length > 0 && (
                    <div style={{ display:'flex', gap:'16px', marginTop:'8px', fontSize:'0.78rem', color:'#64748b' }}>
                      <span>Mín <strong style={{ color:'#fbbf24' }}>{Math.min(...dadosGraficos.temp.map(d=>d.valor))}°C</strong></span>
                      <span>Máx <strong style={{ color:'#fbbf24' }}>{Math.max(...dadosGraficos.temp.map(d=>d.valor))}°C</strong></span>
                      <span>Últ <strong style={{ color:'#fbbf24' }}>{dadosGraficos.temp.at(-1).valor}°C</strong></span>
                    </div>
                  )}
                </CardGrafico>
                <CardGrafico titulo="Saturação O₂ (%)" icon="💓" cor="#4ade80">
                  <GraficoLinha dados={dadosGraficos.sat} cor="#4ade80" unidade="%" vazia="Sem registros de saturação." />
                  {dadosGraficos.sat.length > 0 && (
                    <div style={{ display:'flex', gap:'16px', marginTop:'8px', fontSize:'0.78rem', color:'#64748b' }}>
                      <span>Mín <strong style={{ color:'#4ade80' }}>{Math.min(...dadosGraficos.sat.map(d=>d.valor))}%</strong></span>
                      <span>Máx <strong style={{ color:'#4ade80' }}>{Math.max(...dadosGraficos.sat.map(d=>d.valor))}%</strong></span>
                      <span>Últ <strong style={{ color:'#4ade80' }}>{dadosGraficos.sat.at(-1).valor}%</strong></span>
                    </div>
                  )}
                </CardGrafico>
                <CardGrafico titulo="Glicemia (mg/dL)" icon="🩸" cor="#f87171">
                  <GraficoLinha dados={dadosGraficos.glicemia} cor="#f87171" vazia="Sem registros de glicemia." />
                  {dadosGraficos.glicemia.length > 0 && (
                    <div style={{ display:'flex', gap:'16px', marginTop:'8px', fontSize:'0.78rem', color:'#64748b' }}>
                      <span>Mín <strong style={{ color:'#f87171' }}>{Math.min(...dadosGraficos.glicemia.map(d=>d.valor))} mg/dL</strong></span>
                      <span>Máx <strong style={{ color:'#f87171' }}>{Math.max(...dadosGraficos.glicemia.map(d=>d.valor))} mg/dL</strong></span>
                      <span>Últ <strong style={{ color:'#f87171' }}>{dadosGraficos.glicemia.at(-1).valor} mg/dL</strong></span>
                    </div>
                  )}
                </CardGrafico>
              </div>
              <CardGrafico titulo="Pressão Arterial (mmHg)" icon="🩺" cor="#f87171">
                <GraficoPressao dados={dadosGraficos.pressao} />
                {dadosGraficos.pressao.length > 0 && (
                  <div style={{ display:'flex', gap:'16px', marginTop:'12px', fontSize:'0.78rem', color:'#64748b' }}>
                    <span>Últ:{' '}
                      <strong style={{ color:'#f87171' }}>{dadosGraficos.pressao.at(-1).sistolica}</strong>
                      <span style={{ color:'#60a5fa' }}>/{dadosGraficos.pressao.at(-1).diastolica}</span> mmHg
                    </span>
                  </div>
                )}
              </CardGrafico>
              <CardGrafico titulo="Evoluções por Tipo" icon="📊" cor="#a78bfa">
                <GraficoBarras dados={dadosGraficos.tiposBar} />
              </CardGrafico>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
