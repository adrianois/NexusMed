/**
 * MedicoDocumentos — Lista todos os documentos gerados pelo médico logado.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import BotaoAssinar from '../../components/BotaoAssinar'

const LABELS = {
  atestado:                  { icon: '📄', label: 'Atestado Médico',        cor: '#60a5fa' },
  relatorio:                 { icon: '📋', label: 'Relatório Médico',        cor: '#a78bfa' },
  receita_simples:           { icon: '💊', label: 'Receita Simples',         cor: '#34d399' },
  receita_antimicrobiano:    { icon: '🦠', label: 'Receita Antimicrobianos', cor: '#fbbf24' },
  receita_controle_especial: { icon: '🔒', label: 'Controle Especial',       cor: '#f87171' },
  solicitacao_exames:        { icon: '🔬', label: 'Solicitação de Exames',   cor: '#38bdf8' },
  laudo:                     { icon: '📊', label: 'Laudo',                   cor: '#fb923c' },
  parecer_tecnico:           { icon: '⚖️', label: 'Parecer Técnico',         cor: '#e879f9' },
}

const STATUS_LABEL = {
  pendente_assinatura: { label: 'Pendente',  cor: '#fbbf24' },
  assinado:            { label: 'Assinado',  cor: '#4ade80' },
  cancelado:           { label: 'Cancelado', cor: '#f87171' },
}

export default function MedicoDocumentos() {
  const [docs,       setDocs]       = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro,       setErro]       = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busca,      setBusca]      = useState('')
  const [docAberto,  setDocAberto]  = useState(null)
  const [pdfAberto,  setPdfAberto]  = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(null) // doc a excluir

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { data } = await api.get('/medico/documentos')
      setDocs(data || [])
    } catch (e) {
      setErro(e.response?.data?.error || 'Erro ao carregar documentos.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const excluir = useCallback(async (doc) => {
    try {
      await api.delete(`/medico/documento/${doc.id}`)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
      setConfirmExcluir(null)
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao excluir documento.')
    }
  }, [])

  const docsFiltrados = docs.filter(d => {
    const tipoOk  = filtroTipo === 'todos' || d.tipo === filtroTipo
    const buscaOk = !busca || d.paciente_nome?.toLowerCase().includes(busca.toLowerCase())
    return tipoOk && buscaOk
  })

  return (
    <PageLayout title='📑 Meus Documentos'>
      {/* Filtros */}
      <div style={pg.filtros}>
        <input
          style={pg.input}
          placeholder='🔍 Buscar por paciente...'
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select style={pg.select} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value='todos'>Todos os tipos</option>
          {Object.entries(LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <button style={pg.btnAtualizar} onClick={carregar}>🔄 Atualizar</button>
      </div>

      {carregando ? (
        <div style={pg.centro}>⏳ Carregando documentos...</div>
      ) : erro ? (
        <div style={{ ...pg.centro, color: '#f87171' }}>❌ {erro}</div>
      ) : docsFiltrados.length === 0 ? (
        <div style={pg.centro}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
          <p style={{ color: '#475569' }}>Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div style={pg.lista}>
          {docsFiltrados.map(doc => (
            <CardDoc
              key={doc.id}
              doc={doc}
              onVer={() => setDocAberto(doc)}
              onVerPdf={() => setPdfAberto(doc)}
              onExcluir={() => setConfirmExcluir(doc)}
            />
          ))}
        </div>
      )}

      {/* Modal dados */}
      {docAberto && <ModalVisualizarDoc doc={docAberto} onFechar={() => setDocAberto(null)} />}

      {/* Modal PDF */}
      {pdfAberto && <ModalPdf doc={pdfAberto} onFechar={() => setPdfAberto(null)} />}

      {/* Modal confirmação de exclusão */}
      {confirmExcluir && (
        <ModalConfirmarExclusao
          doc={confirmExcluir}
          onConfirmar={() => excluir(confirmExcluir)}
          onCancelar={() => setConfirmExcluir(null)}
        />
      )}
    </PageLayout>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
function CardDoc({ doc, onVer, onVerPdf, onExcluir }) {
  const meta   = LABELS[doc.tipo] || { icon: '📄', label: doc.tipo, cor: '#64748b' }
  const status = STATUS_LABEL[doc.status] || { label: doc.status, cor: '#64748b' }
  const data   = doc.created_at ? new Date(doc.created_at).toLocaleDateString('pt-BR') : '—'
  const podeExcluir = doc.status !== 'assinado'

  return (
    <div style={{ ...pg.card, borderColor: `${meta.cor}22` }}>
      <div style={pg.cardTop}>
        <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: meta.cor }}>{meta.label}</div>
          {doc.paciente_nome && (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>👤 {doc.paciente_nome}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.72rem', background: `${status.cor}22`, color: status.cor, padding: '3px 8px', borderRadius: '20px', fontWeight: 700 }}>
            {status.label}
          </span>
          <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>{data}</div>
        </div>
      </div>

      <div style={pg.cardAcoes}>
        <button style={pg.btnVer} onClick={onVer}>👁️ Ver dados</button>
        <button style={pg.btnPdf} onClick={onVerPdf}>📄 Ver PDF</button>
        {doc.status === 'pendente_assinatura' && (
          <BotaoAssinar tipoDocumento={doc.tipo} documentoId={doc.id} />
        )}
        {/* Botão excluir — desabilitado para documentos assinados */}
        <button
          style={{ ...pg.btnExcluir, ...(podeExcluir ? {} : pg.btnExcluirDesabilitado) }}
          onClick={podeExcluir ? onExcluir : undefined}
          disabled={!podeExcluir}
          title={podeExcluir ? 'Excluir documento' : 'Documentos assinados não podem ser excluídos'}
        >
          🗑️ Excluir
        </button>
      </div>
    </div>
  )
}

// ── Modal confirmação de exclusão ────────────────────────────────────────────
function ModalConfirmarExclusao({ doc, onConfirmar, onCancelar }) {
  const meta = LABELS[doc.tipo] || { icon: '📄', label: doc.tipo, cor: '#64748b' }
  return (
    <div style={modal.overlay} onClick={onCancelar}>
      <div style={modal.boxAlerta} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', color: '#f1f5f9', fontSize: '1rem' }}>Excluir documento?</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 6px', textAlign: 'center' }}>
          {meta.icon} <strong style={{ color: '#e2e8f0' }}>{meta.label}</strong>
        </p>
        {doc.paciente_nome && (
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 16px' }}>
            Paciente: {doc.paciente_nome}
          </p>
        )}
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '0.8rem', color: '#fca5a5', textAlign: 'center' }}>
          ⚠️ Esta ação é irreversível e ficará registrada no log de auditoria.
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button style={modal.btnCancelar} onClick={onCancelar}>Cancelar</button>
          <button style={modal.btnExcluirConfirm} onClick={onConfirmar}>Sim, excluir</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal PDF ─────────────────────────────────────────────────────────────────
function ModalPdf({ doc, onFechar }) {
  const meta = LABELS[doc.tipo] || { icon: '📄', label: doc.tipo, cor: '#64748b' }
  const [blobUrl, setBlobUrl] = useState(null)
  const [estado,  setEstado]  = useState('carregando')
  const blobRef = useRef(null)

  useEffect(() => {
    let revogado = false
    setEstado('carregando')
    setBlobUrl(null)
    const base  = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
    fetch(`${base}/pdf/documento/${doc.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob() })
      .then(blob => {
        if (revogado) return
        const url = URL.createObjectURL(blob)
        blobRef.current = url
        setBlobUrl(url)
        setEstado('ok')
      })
      .catch(() => { if (!revogado) setEstado('erro') })
    return () => { revogado = true; if (blobRef.current) URL.revokeObjectURL(blobRef.current) }
  }, [doc.id])

  const baixar = () => {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `${doc.tipo}-${doc.id.slice(0, 8)}.pdf`
    a.click()
  }

  return (
    <div style={modal.overlay} onClick={onFechar}>
      <div style={modal.boxPdf} onClick={e => e.stopPropagation()}>
        <div style={modal.header}>
          <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
          <span style={{ fontWeight: 700, color: meta.cor, flex: 1 }}>{meta.label}</span>
          {estado === 'ok' && <button style={modal.btnDownload} onClick={baixar}>⬇️ Baixar PDF</button>}
          <button style={modal.fechar} onClick={onFechar}>✕</button>
        </div>
        {estado === 'carregando' && <div style={modal.centro}>⏳ Gerando PDF...</div>}
        {estado === 'erro'       && <div style={{ ...modal.centro, color: '#f87171' }}>❌ Erro ao gerar PDF.</div>}
        {estado === 'ok' && blobUrl && <iframe src={blobUrl} style={modal.iframe} title={`PDF — ${meta.label}`} />}
      </div>
    </div>
  )
}

// ── Modal dados ───────────────────────────────────────────────────────────────
function ModalVisualizarDoc({ doc, onFechar }) {
  const meta = LABELS[doc.tipo] || { icon: '📄', label: doc.tipo, cor: '#64748b' }
  return (
    <div style={modal.overlay} onClick={onFechar}>
      <div style={modal.box} onClick={e => e.stopPropagation()}>
        <div style={modal.header}>
          <span style={{ fontSize: '1.3rem' }}>{meta.icon}</span>
          <span style={{ fontWeight: 700, color: meta.cor }}>{meta.label}</span>
          <button style={modal.fechar} onClick={onFechar}>✕</button>
        </div>
        <div style={modal.corpo}>
          {doc.paciente_nome && <InfoRow label='Paciente' valor={doc.paciente_nome} />}
          <InfoRow label='Status' valor={STATUS_LABEL[doc.status]?.label || doc.status} />
          <InfoRow label='Data'   valor={doc.created_at ? new Date(doc.created_at).toLocaleString('pt-BR') : '—'} />
          {doc.dados && typeof doc.dados === 'object' && (
            <>
              <div style={modal.secLabel}>📋 Dados do Documento</div>
              {Object.entries(doc.dados).map(([k, v]) => v
                ? <InfoRow key={k} label={k.replace(/_/g, ' ')} valor={String(v)} />
                : null
              )}
            </>
          )}
        </div>
        {doc.status === 'pendente_assinatura' && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'center' }}>
            <BotaoAssinar tipoDocumento={doc.tipo} documentoId={doc.id} />
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, valor }) {
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ minWidth: '140px', fontSize: '0.75rem', color: '#475569', fontWeight: 600, textTransform: 'capitalize' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{valor}</span>
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const pg = {
  filtros:               { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  input:                 { flex: 1, minWidth: '200px', padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.86rem', outline: 'none' },
  select:                { padding: '9px 12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.84rem', cursor: 'pointer' },
  lista:                 { display: 'flex', flexDirection: 'column', gap: '12px' },
  card:                  { background: 'rgba(15,23,42,0.8)', border: '1px solid', borderRadius: '12px', padding: '16px 18px' },
  cardTop:               { display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' },
  cardAcoes:             { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  btnVer:                { padding: '6px 14px', background: 'rgba(96,165,250,0.1)',   border: '1px solid rgba(96,165,250,0.2)',   borderRadius: '6px', color: '#60a5fa', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnPdf:                { padding: '6px 14px', background: 'rgba(251,191,36,0.1)',   border: '1px solid rgba(251,191,36,0.2)',   borderRadius: '6px', color: '#fbbf24', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnExcluir:            { padding: '6px 14px', background: 'rgba(248,113,113,0.1)',  border: '1px solid rgba(248,113,113,0.2)',  borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnExcluirDesabilitado:{ opacity: 0.35, cursor: 'not-allowed' },
  btnAtualizar:          { padding: '8px 16px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',   borderRadius: '8px', color: '#60a5fa', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' },
  centro:                { textAlign: 'center', padding: '60px 20px', color: '#475569' },
}

const modal = {
  overlay:         { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  box:             { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  boxPdf:          { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '860px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  boxAlerta:       { background: '#0f172a', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '16px', padding: '28px 24px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  header:          { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  fechar:          { marginLeft: '8px', background: 'none', border: 'none', color: '#64748b', fontSize: '1rem', cursor: 'pointer' },
  btnDownload:     { padding: '5px 12px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', color: '#4ade80', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  iframe:          { flex: 1, border: 'none', width: '100%', background: '#fff' },
  corpo:           { padding: '18px 20px', overflowY: 'auto', flex: 1 },
  centro:          { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#94a3b8' },
  secLabel:        { fontSize: '0.7rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 8px' },
  btnCancelar:     { padding: '8px 20px', background: 'transparent', border: '1px solid rgba(148,163,184,0.25)', borderRadius: '8px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnExcluirConfirm: { padding: '8px 20px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
