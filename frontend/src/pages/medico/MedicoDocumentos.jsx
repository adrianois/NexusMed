/**
 * MedicoDocumentos — Lista todos os documentos gerados pelo médico logado.
 * Permite filtrar, buscar, visualizar dados e gerar/visualizar PDF.
 */
import { useState, useEffect, useCallback } from 'react'
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

// URL base da API (sem /api se já estiver no baseURL)
function getPdfUrl(docId) {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')
  return `${base}/pdf/documento/${docId}`
}

export default function MedicoDocumentos() {
  const [docs,       setDocs]       = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro,       setErro]       = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busca,      setBusca]      = useState('')
  const [docAberto,  setDocAberto]  = useState(null)
  const [pdfAberto,  setPdfAberto]  = useState(null) // doc para modal PDF

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
            />
          ))}
        </div>
      )}

      {/* Modal dados */}
      {docAberto && (
        <ModalVisualizarDoc doc={docAberto} onFechar={() => setDocAberto(null)} />
      )}

      {/* Modal PDF */}
      {pdfAberto && (
        <ModalPdf doc={pdfAberto} onFechar={() => setPdfAberto(null)} />
      )}
    </PageLayout>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
function CardDoc({ doc, onVer, onVerPdf }) {
  const meta   = LABELS[doc.tipo] || { icon: '📄', label: doc.tipo, cor: '#64748b' }
  const status = STATUS_LABEL[doc.status] || { label: doc.status, cor: '#64748b' }
  const data   = doc.created_at ? new Date(doc.created_at).toLocaleDateString('pt-BR') : '—'

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
      </div>
    </div>
  )
}

// ── Modal PDF ────────────────────────────────────────────────────────────────
function ModalPdf({ doc, onFechar }) {
  const meta   = LABELS[doc.tipo] || { icon: '📄', label: doc.tipo, cor: '#64748b' }
  const pdfUrl = getPdfUrl(doc.id)
  // Adiciona token JWT no header via URL não é possível com <iframe>,
  // então abrimos com fetch + blob ou diretamente com token na query string
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
  const pdfUrlAuth = `${pdfUrl}?token=${token}`

  return (
    <div style={modal.overlay} onClick={onFechar}>
      <div style={modal.boxPdf} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={modal.header}>
          <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
          <span style={{ fontWeight: 700, color: meta.cor, flex: 1 }}>{meta.label}</span>
          <a
            href={pdfUrlAuth}
            target='_blank'
            rel='noreferrer'
            style={modal.btnDownload}
          >
            ⬇️ Baixar PDF
          </a>
          <button style={modal.fechar} onClick={onFechar}>✕</button>
        </div>

        {/* Iframe PDF */}
        <iframe
          src={pdfUrlAuth}
          style={modal.iframe}
          title={`PDF — ${meta.label}`}
        />
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
              {Object.entries(doc.dados).map(([k, v]) => v ? (
                <InfoRow key={k} label={k.replace(/_/g, ' ')} valor={String(v)} />
              ) : null)}
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
  filtros:     { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  input:       { flex: 1, minWidth: '200px', padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.86rem', outline: 'none' },
  select:      { padding: '9px 12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.84rem', cursor: 'pointer' },
  lista:       { display: 'flex', flexDirection: 'column', gap: '12px' },
  card:        { background: 'rgba(15,23,42,0.8)', border: '1px solid', borderRadius: '12px', padding: '16px 18px' },
  cardTop:     { display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' },
  cardAcoes:   { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  btnVer:      { padding: '6px 14px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '6px', color: '#60a5fa', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnPdf:      { padding: '6px 14px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '6px', color: '#fbbf24', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnAtualizar:{ padding: '8px 16px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '8px', color: '#60a5fa', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' },
  centro:      { textAlign: 'center', padding: '60px 20px', color: '#475569' },
}

const modal = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  box:        { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  boxPdf:     { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '860px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  fechar:     { marginLeft: '8px', background: 'none', border: 'none', color: '#64748b', fontSize: '1rem', cursor: 'pointer' },
  btnDownload:{ padding: '5px 12px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', color: '#4ade80', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' },
  iframe:     { flex: 1, border: 'none', width: '100%', background: '#fff' },
  corpo:      { padding: '18px 20px', overflowY: 'auto', flex: 1 },
  secLabel:   { fontSize: '0.7rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 8px' },
}
