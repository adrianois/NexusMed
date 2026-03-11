import { useState } from 'react'
import ModalBase from './ModalBase'
import BotaoAssinar from '../BotaoAssinar'
import { useDocumento } from './hooks/useDocumento'

const EXAME_VAZIO = { nome: '', descricao: '', prazo: 'sem prazo', tipo: 'laboratorial' }
const TIPOS_EXAME = ['laboratorial', 'imagem', 'anatomopatológico', 'funcional', 'outro']

export default function ModalSolicitacaoExames({ consultaId, diagnostico, onFechar, onCriado }) {
  const { salvando, documentoId, erro, salvarDocumento } = useDocumento()
  const [exames, setExames] = useState([{ ...EXAME_VAZIO }])
  const [hipotese, setHipotese] = useState(diagnostico)
  const [urgente, setUrgente] = useState(false)

  const setEx = (i, k, v) => setExames(p => p.map((e, idx) => idx === i ? { ...e, [k]: v } : e))
  const addEx = () => setExames(p => [...p, { ...EXAME_VAZIO }])
  const remEx = (i) => setExames(p => p.filter((_, idx) => idx !== i))

  const salvar = async () => {
    const id = await salvarDocumento('solicitacao_exames', consultaId, { exames, hipotese_diagnostica: hipotese, urgente })
    if (id) onCriado(id)
  }

  return (
    <ModalBase titulo='Solicitação de Exames' icone='🔬' cor='#38bdf8' onFechar={onFechar} salvando={salvando}>
      {!documentoId ? (
        <>
          <div style={grid2}>
            <Campo label='Hipótese diagnóstica'>
              <input style={input} value={hipotese} onChange={e => setHipotese(e.target.value)} />
            </Campo>
            <Campo label='Urgência'>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input type='checkbox' id='urgente' checked={urgente} onChange={e => setUrgente(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor='urgente' style={{ color: urgente ? '#f87171' : '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', fontWeight: urgente ? 700 : 400 }}>
                  {urgente ? '🚨 URGENTE' : 'Rotina'}
                </label>
              </div>
            </Campo>
          </div>

          {exames.map((ex, i) => (
            <div key={i} style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>Exame {i + 1}</span>
                {exames.length > 1 && <button style={btnRem} onClick={() => remEx(i)}>✕</button>}
              </div>
              <div style={grid2}>
                <Campo label='Nome do exame'><input style={input} value={ex.nome} onChange={e => setEx(i, 'nome', e.target.value)} placeholder='Ex: Hemograma completo' /></Campo>
                <Campo label='Tipo'>
                  <select style={input} value={ex.tipo} onChange={e => setEx(i, 'tipo', e.target.value)}>
                    {TIPOS_EXAME.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Campo>
              </div>
              <div style={grid2}>
                <Campo label='Prazo / Orientação'><input style={input} value={ex.prazo} onChange={e => setEx(i, 'prazo', e.target.value)} placeholder='Ex: 7 dias, em jejum' /></Campo>
              </div>
              <Campo label='Justificativa / Descrição'><textarea style={textarea} rows={2} value={ex.descricao} onChange={e => setEx(i, 'descricao', e.target.value)} placeholder='Indicação clínica para o exame...' /></Campo>
            </div>
          ))}
          <button style={btnAdd} onClick={addEx}>+ Adicionar exame</button>

          {erro && <p style={erroStyle}>{erro}</p>}
          <div style={rodape}>
            <button style={btnSec} onClick={onFechar}>Cancelar</button>
            <button style={btnPri} disabled={salvando || !exames[0]?.nome} onClick={salvar}>
              {salvando ? '⏳ Gerando...' : '🔬 Gerar Solicitação'}
            </button>
          </div>
        </>
      ) : (
        <Gerado tipo='solicitacao_exames' documentoId={documentoId} onFechar={onFechar} />
      )}
    </ModalBase>
  )
}

function Gerado({ tipo, documentoId, onFechar }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
      <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '6px' }}>Solicitação gerada!</p>
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
const input = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.87rem', boxSizing: 'border-box' }
const textarea = { ...input, resize: 'vertical', fontFamily: 'inherit' }
const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const rodape = { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }
const btnPri = { padding: '9px 20px', background: 'linear-gradient(135deg,#0284c7,#0369a1)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }
const btnSec = { padding: '9px 18px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }
const btnAdd = { width: '100%', padding: '8px', background: 'rgba(56,189,248,0.07)', border: '1px dashed rgba(56,189,248,0.3)', borderRadius: '8px', color: '#38bdf8', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '14px' }
const btnRem = { background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.78rem', cursor: 'pointer' }
const erroStyle = { color: '#f87171', fontSize: '0.82rem', marginTop: '8px' }
