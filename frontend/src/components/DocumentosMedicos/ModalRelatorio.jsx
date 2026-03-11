import { useState } from 'react'
import ModalBase from './ModalBase'
import BotaoAssinar from '../BotaoAssinar'
import { useDocumento } from './hooks/useDocumento'

export default function ModalRelatorio({ consultaId, paciente, diagnostico, onFechar, onCriado }) {
  const { salvando, documentoId, erro, salvarDocumento } = useDocumento()
  const [form, setForm] = useState({
    diagnostico,
    historico_clinico: '',
    exames_realizados: '',
    evolucao: '',
    observacoes: '',
    destinatario: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const salvar = async () => {
    const id = await salvarDocumento('relatorio', consultaId, form)
    if (id) onCriado(id)
  }

  return (
    <ModalBase titulo='Relatório Médico' icone='📋' cor='#a78bfa' onFechar={onFechar} salvando={salvando}>
      {!documentoId ? (
        <>
          <Campo label='Destinatário (opcional)'>
            <input style={input} value={form.destinatario} onChange={e => set('destinatario', e.target.value)} placeholder='Ex: Dr. João — Cardiologia' />
          </Campo>
          <Campo label='Diagnóstico'>
            <input style={input} value={form.diagnostico} onChange={e => set('diagnostico', e.target.value)} />
          </Campo>
          <Campo label='Histórico clínico'>
            <textarea style={textarea} rows={3} value={form.historico_clinico} onChange={e => set('historico_clinico', e.target.value)} placeholder='Histórico e evolução do quadro clínico...' />
          </Campo>
          <Campo label='Exames realizados'>
            <textarea style={textarea} rows={2} value={form.exames_realizados} onChange={e => set('exames_realizados', e.target.value)} placeholder='Resultados de exames relevantes...' />
          </Campo>
          <Campo label='Evolução e conduta'>
            <textarea style={textarea} rows={3} value={form.evolucao} onChange={e => set('evolucao', e.target.value)} placeholder='Evolução clínica e conduta adotada...' />
          </Campo>
          <Campo label='Observações'>
            <textarea style={textarea} rows={2} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder='Observações adicionais...' />
          </Campo>
          {erro && <p style={erroStyle}>{erro}</p>}
          <div style={rodape}>
            <button style={btnSec} onClick={onFechar}>Cancelar</button>
            <button style={btnPri} disabled={salvando} onClick={salvar}>
              {salvando ? '⏳ Gerando PDF...' : '📋 Gerar Relatório'}
            </button>
          </div>
        </>
      ) : (
        <Gerado tipo='relatorio' documentoId={documentoId} onFechar={onFechar} />
      )}
    </ModalBase>
  )
}

function Gerado({ tipo, documentoId, onFechar }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
      <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '6px' }}>Relatório gerado com sucesso!</p>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>Assine com GOV.BR para garantir validade jurídica.</p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <BotaoAssinar tipoDocumento={tipo} documentoId={documentoId} />
      </div>
      <button style={btnSec} onClick={onFechar}>Fechar</button>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

const input   = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.87rem', boxSizing: 'border-box' }
const textarea= { ...input, resize: 'vertical', fontFamily: 'inherit' }
const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const rodape  = { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }
const btnPri  = { padding: '9px 20px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }
const btnSec  = { padding: '9px 18px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }
const erroStyle = { color: '#f87171', fontSize: '0.82rem', marginTop: '8px' }
