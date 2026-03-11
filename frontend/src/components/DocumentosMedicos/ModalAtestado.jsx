import { useState } from 'react'
import ModalBase from './ModalBase'
import BotaoAssinar from '../BotaoAssinar'
import { useDocumento } from './hooks/useDocumento'

export default function ModalAtestado({ consultaId, paciente, diagnostico, cid10, onFechar, onCriado }) {
  const { salvando, documentoId, erro, salvarDocumento } = useDocumento()
  const [form, setForm] = useState({
    diagnostico,
    periodo_dias: '',
    justificativa: '',
    restricoes: '',
    data_inicio: new Date().toISOString().slice(0, 10),
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const salvar = async () => {
    const id = await salvarDocumento('atestado', consultaId, form)
    if (id) onCriado(id)
  }

  return (
    <ModalBase titulo='Atestado Médico' icone='📄' cor='#60a5fa' onFechar={onFechar} salvando={salvando}>
      {!documentoId ? (
        <>
          <div style={grid2}>
            <Campo label='Diagnóstico'>
              <input style={input} value={form.diagnostico} onChange={e => set('diagnostico', e.target.value)} placeholder='Ex: Infecção respiratória aguda' />
            </Campo>
            <Campo label='CID-10'>
              <input style={input} value={cid10} disabled />
            </Campo>
          </div>
          <div style={grid2}>
            <Campo label='Data de início'>
              <input style={input} type='date' value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} />
            </Campo>
            <Campo label='Período (dias)'>
              <input style={input} type='number' min='1' value={form.periodo_dias} onChange={e => set('periodo_dias', e.target.value)} placeholder='Ex: 3' />
            </Campo>
          </div>
          <Campo label='Justificativa clínica'>
            <textarea style={textarea} rows={3} value={form.justificativa} onChange={e => set('justificativa', e.target.value)} placeholder='Justificativa médica para o afastamento...' />
          </Campo>
          <Campo label='Restrições / Observações'>
            <textarea style={textarea} rows={2} value={form.restricoes} onChange={e => set('restricoes', e.target.value)} placeholder='Restrições de atividades, repouso, etc.' />
          </Campo>
          {erro && <p style={erroStyle}>{erro}</p>}
          <div style={rodape}>
            <button style={btnSec} onClick={onFechar}>Cancelar</button>
            <button style={btnPri} onClick={salvar} disabled={salvando || !form.periodo_dias}>
              {salvando ? '⏳ Gerando PDF...' : '📄 Gerar Atestado'}
            </button>
          </div>
        </>
      ) : (
        <Gerado tipo='atestado' documentoId={documentoId} onFechar={onFechar} />
      )}
    </ModalBase>
  )
}

function Gerado({ tipo, documentoId, onFechar }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
      <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '6px' }}>Documento gerado com sucesso!</p>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>Assine agora com seu certificado GOV.BR para dar validade jurídica.</p>
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

const grid2   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
const input   = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.87rem', boxSizing: 'border-box' }
const textarea= { ...input, resize: 'vertical', fontFamily: 'inherit' }
const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const rodape  = { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }
const btnPri  = { padding: '9px 20px', background: 'linear-gradient(135deg,#1351B4,#0d3d8f)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }
const btnSec  = { padding: '9px 18px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }
const erroStyle = { color: '#f87171', fontSize: '0.82rem', marginTop: '8px' }
