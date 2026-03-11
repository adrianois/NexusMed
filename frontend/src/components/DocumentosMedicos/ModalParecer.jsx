import { useState } from 'react'
import ModalBase from './ModalBase'
import BotaoAssinar from '../BotaoAssinar'
import { useDocumento } from './hooks/useDocumento'

export default function ModalParecer({ consultaId, diagnostico, onFechar, onCriado }) {
  const { salvando, documentoId, erro, salvarDocumento } = useDocumento()
  const [form, setForm] = useState({
    destinatario: '',
    especialidade_solicitante: '',
    questionamento: '',
    parecer: '',
    fundamentacao: '',
    recomendacoes: '',
    data_avaliacao: new Date().toISOString().slice(0, 10),
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const salvar = async () => {
    const id = await salvarDocumento('parecer_tecnico', consultaId, form)
    if (id) onCriado(id)
  }

  return (
    <ModalBase titulo='Parecer Técnico' icone='⚖️' cor='#e879f9' onFechar={onFechar} salvando={salvando}>
      {!documentoId ? (
        <>
          <div style={grid2}>
            <Campo label='Para (destinatário)'>
              <input style={input} value={form.destinatario} onChange={e => set('destinatario', e.target.value)} placeholder='Ex: Dr. Ana Souza — Cirurgia' />
            </Campo>
            <Campo label='Especialidade solicitante'>
              <input style={input} value={form.especialidade_solicitante} onChange={e => set('especialidade_solicitante', e.target.value)} placeholder='Ex: Cardiologia' />
            </Campo>
          </div>
          <Campo label='Data da avaliação'>
            <input style={input} type='date' value={form.data_avaliacao} onChange={e => set('data_avaliacao', e.target.value)} />
          </Campo>
          <Campo label='Questionamento / Motivo do parecer'>
            <textarea style={textarea} rows={3} value={form.questionamento} onChange={e => set('questionamento', e.target.value)} placeholder='Qual a questão clínica levantada para este parecer?' />
          </Campo>
          <Campo label='Parecer médico'>
            <textarea style={textarea} rows={4} value={form.parecer} onChange={e => set('parecer', e.target.value)} placeholder='Posicionamento médico fundamentado...' />
          </Campo>
          <Campo label='Fundamentação técnica'>
            <textarea style={textarea} rows={3} value={form.fundamentacao} onChange={e => set('fundamentacao', e.target.value)} placeholder='Base científica, literatura, diretrizes...' />
          </Campo>
          <Campo label='Recomendações'>
            <textarea style={textarea} rows={2} value={form.recomendacoes} onChange={e => set('recomendacoes', e.target.value)} placeholder='Conduta recomendada ao colega...' />
          </Campo>

          {erro && <p style={erroStyle}>{erro}</p>}
          <div style={rodape}>
            <button style={btnSec} onClick={onFechar}>Cancelar</button>
            <button style={btnPri} disabled={salvando || !form.parecer} onClick={salvar}>
              {salvando ? '⏳ Gerando...' : '⚖️ Gerar Parecer'}
            </button>
          </div>
        </>
      ) : (
        <Gerado tipo='parecer_tecnico' documentoId={documentoId} onFechar={onFechar} />
      )}
    </ModalBase>
  )
}

function Gerado({ tipo, documentoId, onFechar }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
      <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '6px' }}>Parecer gerado!</p>
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
const rodape = { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }
const btnPri = { padding: '9px 20px', background: 'linear-gradient(135deg,#9333ea,#7e22ce)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }
const btnSec = { padding: '9px 18px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }
const erroStyle = { color: '#f87171', fontSize: '0.82rem', marginTop: '8px' }
