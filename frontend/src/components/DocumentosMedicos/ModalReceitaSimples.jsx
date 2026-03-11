import { useState } from 'react'
import ModalBase from './ModalBase'
import BotaoAssinar from '../BotaoAssinar'
import { useDocumento } from './hooks/useDocumento'

const MED_VAZIO = { nome: '', concentracao: '', forma: '', posologia: '', duracao: '', quantidade: '' }

export default function ModalReceitaSimples({ consultaId, onFechar, onCriado }) {
  const { salvando, documentoId, erro, salvarDocumento } = useDocumento()
  const [meds, setMeds] = useState([{ ...MED_VAZIO }])
  const [observacoes, setObs] = useState('')

  const setMed = (i, k, v) => setMeds(p => p.map((m, idx) => idx === i ? { ...m, [k]: v } : m))
  const addMed = () => setMeds(p => [...p, { ...MED_VAZIO }])
  const remMed = (i) => setMeds(p => p.filter((_, idx) => idx !== i))

  const salvar = async () => {
    const id = await salvarDocumento('receita_simples', consultaId, { medicamentos: meds, observacoes })
    if (id) onCriado(id)
  }

  const valido = meds.every(m => m.nome && m.posologia)

  return (
    <ModalBase titulo='Receita Simples' icone='💊' cor='#34d399' onFechar={onFechar} salvando={salvando}>
      {!documentoId ? (
        <>
          {meds.map((m, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>Medicamento {i + 1}</span>
                {meds.length > 1 && <button style={btnRem} onClick={() => remMed(i)}>✕ Remover</button>}
              </div>
              <div style={grid2}>
                <Campo label='Nome do medicamento'>
                  <input style={input} value={m.nome} onChange={e => setMed(i, 'nome', e.target.value)} placeholder='Ex: Amoxicilina' />
                </Campo>
                <Campo label='Concentração'>
                  <input style={input} value={m.concentracao} onChange={e => setMed(i, 'concentracao', e.target.value)} placeholder='Ex: 500mg' />
                </Campo>
              </div>
              <div style={grid2}>
                <Campo label='Forma farmacêutica'>
                  <input style={input} value={m.forma} onChange={e => setMed(i, 'forma', e.target.value)} placeholder='Ex: Cápsula' />
                </Campo>
                <Campo label='Quantidade'>
                  <input style={input} value={m.quantidade} onChange={e => setMed(i, 'quantidade', e.target.value)} placeholder='Ex: 21 cápsulas' />
                </Campo>
              </div>
              <Campo label='Posologia (modo de uso)'>
                <textarea style={textarea} rows={2} value={m.posologia} onChange={e => setMed(i, 'posologia', e.target.value)} placeholder='Ex: 1 cápsula de 8 em 8 horas por 7 dias' />
              </Campo>
              <Campo label='Duração do tratamento'>
                <input style={input} value={m.duracao} onChange={e => setMed(i, 'duracao', e.target.value)} placeholder='Ex: 7 dias' />
              </Campo>
            </div>
          ))}

          <button style={btnAdd} onClick={addMed}>+ Adicionar medicamento</button>

          <Campo label='Observações'>
            <textarea style={textarea} rows={2} value={observacoes} onChange={e => setObs(e.target.value)} placeholder='Observações gerais da receita...' />
          </Campo>

          {erro && <p style={erroStyle}>{erro}</p>}
          <div style={rodape}>
            <button style={btnSec} onClick={onFechar}>Cancelar</button>
            <button style={btnPri} disabled={salvando || !valido} onClick={salvar}>
              {salvando ? '⏳ Gerando PDF...' : '💊 Gerar Receita'}
            </button>
          </div>
        </>
      ) : (
        <Gerado tipo='receita_simples' documentoId={documentoId} onFechar={onFechar} />
      )}
    </ModalBase>
  )
}

function Gerado({ tipo, documentoId, onFechar }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
      <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '6px' }}>Receita gerada com sucesso!</p>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>Assine com GOV.BR para dar validade.</p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <BotaoAssinar tipoDocumento={tipo} documentoId={documentoId} />
      </div>
      <button style={btnSec} onClick={onFechar}>Fechar</button>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

const grid2   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }
const input   = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.87rem', boxSizing: 'border-box' }
const textarea= { ...input, resize: 'vertical', fontFamily: 'inherit' }
const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const rodape  = { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }
const btnPri  = { padding: '9px 20px', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }
const btnSec  = { padding: '9px 18px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }
const btnAdd  = { width: '100%', padding: '8px', background: 'rgba(52,211,153,0.07)', border: '1px dashed rgba(52,211,153,0.3)', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '14px' }
const btnRem  = { background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.78rem', cursor: 'pointer' }
const erroStyle = { color: '#f87171', fontSize: '0.82rem', marginTop: '8px' }
