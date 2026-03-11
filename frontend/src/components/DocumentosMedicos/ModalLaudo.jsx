import { useState } from 'react'
import ModalBase from './ModalBase'
import BotaoAssinar from '../BotaoAssinar'
import { useDocumento } from './hooks/useDocumento'

export default function ModalLaudo({ consultaId, diagnostico, onFechar, onCriado }) {
  const { salvando, documentoId, erro, salvarDocumento } = useDocumento()
  const [form, setForm] = useState({
    procedimento: '',
    data_procedimento: new Date().toISOString().slice(0, 10),
    indicacao: diagnostico,
    descricao_tecnica: '',
    resultados: '',
    conclusao: '',
    recomendacoes: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const salvar = async () => {
    const id = await salvarDocumento('laudo', consultaId, form)
    if (id) onCriado(id)
  }

  return (
    <ModalBase titulo='Laudo Médico' icone='📊' cor='#fb923c' onFechar={onFechar} salvando={salvando}>
      {!documentoId ? (
        <>
          <div style={aviso}>
            ⚠️ Laudos exigem assinatura com certificado avançado (VIDAAS ou GOV.BR nível Ouro) para validade jurídica plena.
          </div>

          <div style={grid2}>
            <Campo label='Procedimento / Exame laudado'>
              <input style={input} value={form.procedimento} onChange={e => set('procedimento', e.target.value)} placeholder='Ex: Eletrocardiograma, USG abdominal' />
            </Campo>
            <Campo label='Data do procedimento'>
              <input style={input} type='date' value={form.data_procedimento} onChange={e => set('data_procedimento', e.target.value)} />
            </Campo>
          </div>
          <Campo label='Indicação clínica'>
            <input style={input} value={form.indicacao} onChange={e => set('indicacao', e.target.value)} />
          </Campo>
          <Campo label='Descrição técnica do exame'>
            <textarea style={textarea} rows={3} value={form.descricao_tecnica} onChange={e => set('descricao_tecnica', e.target.value)} placeholder='Técnica utilizada, equipamento, condições...' />
          </Campo>
          <Campo label='Achados / Resultados'>
            <textarea style={textarea} rows={4} value={form.resultados} onChange={e => set('resultados', e.target.value)} placeholder='Descreva os achados do exame...' />
          </Campo>
          <Campo label='Conclusão / Impressão diagnóstica'>
            <textarea style={textarea} rows={3} value={form.conclusao} onChange={e => set('conclusao', e.target.value)} placeholder='Conclusão do laudo...' />
          </Campo>
          <Campo label='Recomendações'>
            <textarea style={textarea} rows={2} value={form.recomendacoes} onChange={e => set('recomendacoes', e.target.value)} placeholder='Conduta recomendada...' />
          </Campo>

          {erro && <p style={erroStyle}>{erro}</p>}
          <div style={rodape}>
            <button style={btnSec} onClick={onFechar}>Cancelar</button>
            <button style={btnPri} disabled={salvando || !form.procedimento || !form.resultados} onClick={salvar}>
              {salvando ? '⏳ Gerando...' : '📊 Gerar Laudo'}
            </button>
          </div>
        </>
      ) : (
        <Gerado tipo='laudo' documentoId={documentoId} onFechar={onFechar} />
      )}
    </ModalBase>
  )
}

function Gerado({ tipo, documentoId, onFechar }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
      <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '6px' }}>Laudo gerado!</p>
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

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
const input = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.87rem', boxSizing: 'border-box' }
const textarea = { ...input, resize: 'vertical', fontFamily: 'inherit' }
const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const aviso = { background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.82rem', color: '#fdba74' }
const rodape = { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }
const btnPri = { padding: '9px 20px', background: 'linear-gradient(135deg,#ea580c,#c2410c)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }
const btnSec = { padding: '9px 18px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }
const erroStyle = { color: '#f87171', fontSize: '0.82rem', marginTop: '8px' }
