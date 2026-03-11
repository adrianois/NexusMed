/**
 * DocumentosMedicos — Painel completo de geração de documentos médicos.
 * Renderiza o seletor de tipo + modal de preenchimento + BotaoAssinar.
 *
 * Uso:
 *   <DocumentosMedicos consultaId={id} paciente={obj} diagnostico="..." />
 */
import { useState } from 'react'
import ModalAtestado            from './ModalAtestado'
import ModalRelatorio           from './ModalRelatorio'
import ModalReceitaSimples      from './ModalReceitaSimples'
import ModalReceitaAntimicro    from './ModalReceitaAntimicro'
import ModalReceitaControle     from './ModalReceitaControle'
import ModalSolicitacaoExames   from './ModalSolicitacaoExames'
import ModalLaudo               from './ModalLaudo'
import ModalParecer             from './ModalParecer'

const DOCUMENTOS = [
  { tipo: 'atestado',                  icon: '📄', label: 'Atestado Médico',          cor: '#60a5fa', desc: 'Afastamento, período e restrições' },
  { tipo: 'relatorio',                 icon: '📋', label: 'Relatório Médico',          cor: '#a78bfa', desc: 'Relatório clínico completo' },
  { tipo: 'receita_simples',           icon: '💊', label: 'Receita Simples',           cor: '#34d399', desc: 'Medicamentos de uso comum' },
  { tipo: 'receita_antimicrobiano',    icon: '🦠', label: 'Receita Antimicrobianos',   cor: '#fbbf24', desc: 'Antibióticos e antimicrobianos', aviso: true },
  { tipo: 'receita_controle_especial', icon: '🔒', label: 'Controle Especial',         cor: '#f87171', desc: 'Via dupla — requer VIDAAS', aviso: true },
  { tipo: 'solicitacao_exames',        icon: '🔬', label: 'Solicitação de Exames',     cor: '#38bdf8', desc: 'Exames laboratoriais e imagem' },
  { tipo: 'laudo',                     icon: '📊', label: 'Laudo',                     cor: '#fb923c', desc: 'Laudo de procedimento ou exame', aviso: true },
  { tipo: 'parecer_tecnico',           icon: '⚖️', label: 'Parecer Técnico',           cor: '#e879f9', desc: 'Parecer médico especializado' },
]

const MODAIS = {
  atestado:                  ModalAtestado,
  relatorio:                 ModalRelatorio,
  receita_simples:           ModalReceitaSimples,
  receita_antimicrobiano:    ModalReceitaAntimicro,
  receita_controle_especial: ModalReceitaControle,
  solicitacao_exames:        ModalSolicitacaoExames,
  laudo:                     ModalLaudo,
  parecer_tecnico:           ModalParecer,
}

export default function DocumentosMedicos({ consultaId, paciente, diagnostico = '', cid10 = '' }) {
  const [tipoAberto, setTipoAberto] = useState(null)
  const [docGerado,  setDocGerado]  = useState({}) // { [tipo]: documentoId }

  const ModalAtivo = tipoAberto ? MODAIS[tipoAberto] : null

  const onDocumentoCriado = (tipo, documentoId) => {
    setDocGerado(prev => ({ ...prev, [tipo]: documentoId }))
    setTipoAberto(null)
  }

  return (
    <div style={estilos.container}>
      {/* Cabeçalho da seção */}
      <div style={estilos.cabecalho}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          📑 Documentos Médicos
        </span>
        <span style={{ fontSize: '0.75rem', color: '#475569' }}>Gere e assine documentos com GOV.BR</span>
      </div>

      {/* Grid de cards de documentos */}
      <div style={estilos.grid}>
        {DOCUMENTOS.map(doc => {
          const idGerado = docGerado[doc.tipo]
          return (
            <button
              key={doc.tipo}
              style={{
                ...estilos.card,
                borderColor: idGerado ? 'rgba(74,222,128,0.35)' : `${doc.cor}22`,
                background:  idGerado ? 'rgba(34,197,94,0.06)' : `${doc.cor}0d`,
              }}
              onClick={() => setTipoAberto(doc.tipo)}
              title={doc.desc}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.15rem' }}>{doc.icon}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: idGerado ? '#4ade80' : doc.cor }}>
                  {doc.label}
                </span>
                {doc.aviso && !idGerado && (
                  <span style={{ fontSize: '0.6rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>CFM</span>
                )}
                {idGerado && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>✅</span>}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'left' }}>{doc.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Modal ativo */}
      {ModalAtivo && (
        <ModalAtivo
          consultaId={consultaId}
          paciente={paciente}
          diagnostico={diagnostico}
          cid10={cid10}
          onFechar={() => setTipoAberto(null)}
          onCriado={(docId) => onDocumentoCriado(tipoAberto, docId)}
        />
      )}
    </div>
  )
}

const estilos = {
  container: {
    marginTop: '24px',
    background: 'linear-gradient(145deg,#111827,#0f172a)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '22px 26px',
  },
  cabecalho: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
  },
  card: {
    padding: '12px 14px',
    border: '1px solid',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    background: 'transparent',
  },
}
