import { useState } from 'react'
import ModalBase from './ModalBase'
import BotaoAssinar from '../BotaoAssinar'
import { useDocumento } from './hooks/useDocumento'

const MED_VAZIO = { nome: '', concentracao: '', posologia: '', quantidade: '', classificacao: 'C1' }
const CLASSES = ['A1','A2','A3','B1','B2','C1','C2','C3','C4','C5','D1','D2','E']

export default function ModalReceitaControle({ consultaId, diagnostico, onFechar, onCriado }) {
  const { salvando, documentoId, erro, salvarDocumento } = useDocumento()
  const [meds, setMeds] = useState([{ ...MED_VAZIO }])
  const [indicacao, setIndicacao] = useState(diagnostico)

  const setMed = (i, k, v) => setMeds(p => p.map((m, idx) => idx === i ? { ...m, [k]: v } : m))
  const addMed = () => setMeds(p => [...p, { ...MED_VAZIO }])
  const remMed = (i) => setMeds(p => p.filter((_, idx) => idx !== i))

  const salvar = async () => {
    const id = await salvarDocumento('receita_controle_especial', consultaId, { medicamentos: meds, indicacao })
    if (id) onCriado(id)
  }

  return (
    <ModalBase titulo='Receita de Controle Especial' icone='🔒' cor='#f87171' onFechar={onFechar} salvando={salvando}>
      {!documentoId ? (
        <>
          <div style={avisoVermelho}>
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '3px' }}>VIDAAS obrigatório</strong>
              <span>Esta receita exige assinatura com certificado digital do CRM (VIDAAS). A assinatura via GOV.BR pode não ter validade legal para este documento conforme RDC 344/1998.</span>
            </div>
          </div>

          <Campo label='Indicação clínica'>
            <input style={input} value={indicacao} onChange={e => setIndicacao(e.target.value)} />
          </Campo>

          {meds.map((m, i) => (
            <div key={i} style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700 }}>Medicamento {i + 1}</span>
                {meds.length > 1 && <button style={btnRem} onClick={() => remMed(i)}>✕</button>}
              </div>
              <div style={grid3}>
                <Campo label='Nome'><input style={input} value={m.nome} onChange={e => setMed(i, 'nome', e.target.value)} /></Campo>
                <Campo label='Concentração'><input style={input} value={m.concentracao} onChange={e => setMed(i, 'concentracao', e.target.value)} /></Campo>
                <Campo label='Classe'>
                  <select style={input} value={m.classificacao} onChange={e => setMed(i, 'classificacao', e.target.value)}>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Campo>
              </div>
              <div style={grid2}>
                <Campo label='Quantidade'><input style={input} value={m.quantidade} onChange={e => setMed(i, 'quantidade', e.target.value)} /></Campo>
              </div>
              <Campo label='Posologia'><textarea style={textarea} rows={2} value={m.posologia} onChange={e => setMed(i, 'posologia', e.target.value)} /></Campo>
            </div>
          ))}
          <button style={btnAdd} onClick={addMed}>+ Adicionar medicamento</button>

          {erro && <p style={erroStyle}>{erro}</p>}
          <div style={rodape}>
            <button style={btnSec} onClick={onFechar}>Cancelar</button>
            <button style={btnPri} disabled={salvando || !indicacao} onClick={salvar}>
              {salvando ? '⏳ Gerando...' : '🔒 Gerar Receita'}
            </button>
          </div>
        </>
      ) : (
        <Gerado tipo='receita_controle_especial' documentoId={documentoId} onFechar={onFechar} />
      )}
    </ModalBase>
  )
}

function Gerado({ tipo, documentoId, onFechar }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
      <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '6px' }}>Receita gerada!</p>
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

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }
const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '10px' }
const input = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.87rem', boxSizing: 'border-box' }
const textarea = { ...input, resize: 'vertical', fontFamily: 'inherit' }
const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const avisoVermelho = { display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderLeft: '3px solid #f87171', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.82rem', color: '#fca5a5' }
const rodape = { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }
const btnPri = { padding: '9px 20px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }
const btnSec = { padding: '9px 18px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }
const btnAdd = { width: '100%', padding: '8px', background: 'rgba(248,113,113,0.07)', border: '1px dashed rgba(248,113,113,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '14px' }
const btnRem = { background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.78rem', cursor: 'pointer' }
const erroStyle = { color: '#f87171', fontSize: '0.82rem', marginTop: '8px' }
