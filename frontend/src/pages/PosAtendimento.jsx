import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmModal'
import ModalAgendarRetorno from '../components/ModalAgendarRetorno'
import './InnerPage.css'

const COB_CFG = {
  pendente:  { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  label: 'Pendente'  },
  realizado: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)',  label: 'Realizado' },
  isento:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Isento'    },
  convenio:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Convênio'  },
}

function BadgeCob({ status }) {
  const cfg = COB_CFG[status] || COB_CFG.pendente
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33`,
      padding: '2px 9px', borderRadius: '20px', fontSize: '0.70rem', fontWeight: 700,
    }}>{cfg.label}</span>
  )
}

function CheckItem({ checked, onChange, label }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '7px',
      fontSize: '0.82rem', color: checked ? '#4ade80' : '#94a3b8',
      cursor: 'pointer', userSelect: 'none',
    }}>
      <input type='checkbox' checked={checked} onChange={onChange}
        style={{ accentColor: '#4ade80', width: '15px', height: '15px' }} />
      <span style={{ textDecoration: checked ? 'line-through' : 'none' }}>{label}</span>
    </label>
  )
}

function CardPaciente({ item, onSalvar, onFinalizar, onAbrirModal }) {
  const pos   = item.pos_atendimento
  const pront = item.prontuario

  const [form, setForm] = useState({
    doc_receita:        pos?.doc_receita        ?? false,
    doc_atestado:       pos?.doc_atestado       ?? false,
    doc_solicitacao_ex: pos?.doc_solicitacao_ex ?? false,
    doc_outros:         pos?.doc_outros         ?? false,
    cobranca_status:    pos?.cobranca_status    || 'pendente',
    cobranca_obs:       pos?.cobranca_obs       || '',
    retorno_agendado:   pos?.retorno_agendado   ?? false,
    observacoes_saida:  pos?.observacoes_saida  || '',
  })
  const [salvando, setSalvando] = useState(false)
  const [aberto,   setAberto]   = useState(!pos?.finalizado)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const finalizado = pos?.finalizado

  return (
    <div style={{
      background: finalizado ? 'rgba(34,197,94,0.04)' : 'linear-gradient(145deg,#111827,#0f172a)',
      border: `1px solid ${finalizado ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '14px', marginBottom: '14px', overflow: 'hidden',
    }}>

      {/* Cabeçalho */}
      <div onClick={() => setAberto(a => !a)}
        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', cursor: 'pointer' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: finalizado ? 'rgba(74,222,128,0.12)' : 'rgba(96,165,250,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', flexShrink: 0,
        }}>{finalizado ? '✅' : '⏳'}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: finalizado ? '#4ade80' : '#e2e8f0' }}>
            {item.paciente?.nome || '—'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {item.horario && <span>⏰ {item.horario}</span>}
            {item.medico?.nome && <span>👨‍⚕️ {item.medico.nome}</span>}
            {item.motivo && <span style={{ fontStyle: 'italic' }}>{item.motivo}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <BadgeCob status={form.cobranca_status} />
          {pront?.retorno_dias > 0 && (
            <span style={{
              background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
              border: '1px solid rgba(167,139,250,0.2)',
              padding: '2px 9px', borderRadius: '20px', fontSize: '0.70rem', fontWeight: 700,
            }}>🔄 Retorno {pront.retorno_dias}d</span>
          )}
          {finalizado && (
            <span style={{
              background: 'rgba(74,222,128,0.12)', color: '#4ade80',
              border: '1px solid rgba(74,222,128,0.2)',
              padding: '2px 9px', borderRadius: '20px', fontSize: '0.70rem', fontWeight: 700,
            }}>Concluído</span>
          )}
        </div>
        <span style={{ color: '#334155', fontSize: '0.8rem' }}>{aberto ? '▲' : '▼'}</span>
      </div>

      {/* Corpo */}
      {aberto && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

          {pront?.diagnostico && (
            <div style={{
              background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)',
              borderRadius: '8px', padding: '10px 14px', margin: '14px 0',
              fontSize: '0.82rem', color: '#94a3b8',
            }}>
              <span style={{ color: '#60a5fa', fontWeight: 700 }}>Diagnóstico: </span>{pront.diagnostico}
              {pront.retorno_dias > 0 && (
                <span style={{ marginLeft: '12px', color: '#a78bfa' }}>
                  · Retorno indicado em <strong>{pront.retorno_dias} dias</strong>
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '14px' }}>
            {/* Documentos */}
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>📄 Documentos entregues</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <CheckItem checked={form.doc_receita}        onChange={e => set('doc_receita', e.target.checked)}        label='Receita médica' />
                <CheckItem checked={form.doc_atestado}       onChange={e => set('doc_atestado', e.target.checked)}       label='Atestado' />
                <CheckItem checked={form.doc_solicitacao_ex} onChange={e => set('doc_solicitacao_ex', e.target.checked)} label='Solicitação de exames' />
                <CheckItem checked={form.doc_outros}         onChange={e => set('doc_outros', e.target.checked)}         label='Outros documentos' />
              </div>
            </div>
            {/* Cobrança */}
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>💰 Cobrança</div>
              <select className='form-select' value={form.cobranca_status}
                onChange={e => set('cobranca_status', e.target.value)} disabled={finalizado}>
                {Object.entries(COB_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <input className='form-input' style={{ marginTop: '8px' }}
                placeholder='Obs. de cobrança (opcional)'
                value={form.cobranca_obs} onChange={e => set('cobranca_obs', e.target.value)}
                disabled={finalizado} />
            </div>
          </div>

          {/* Retorno */}
          {pront?.retorno_dias > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>🔄 Retorno</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <CheckItem
                  checked={form.retorno_agendado}
                  onChange={e => set('retorno_agendado', e.target.checked)}
                  label={`Retorno de ${pront.retorno_dias} dias já agendado`}
                />
                {!form.retorno_agendado && !finalizado && (
                  <button
                    className='btn btn-primary'
                    style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                    onClick={() => onAbrirModal({
                      paciente_id:   item.paciente?.id,
                      paciente_nome: item.paciente?.nome,
                      motivo:        pront.diagnostico || item.motivo,
                      retorno_dias:  pront.retorno_dias,
                    })}
                  >
                    📅 Agendar retorno
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Observações de saída */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>📝 Observações de saída</div>
            <textarea className='form-textarea' rows={2}
              placeholder='Orientações dadas, intercorrências, observações gerais...'
              value={form.observacoes_saida} onChange={e => set('observacoes_saida', e.target.value)}
              disabled={finalizado} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>

          {/* Ações */}
          {!finalizado && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button className='btn btn-secondary' style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                disabled={salvando}
                onClick={() => onSalvar(item.consulta_id, item.paciente?.id, form, setSalvando)}>
                {salvando ? '⏳ Salvando...' : '💾 Salvar'}
              </button>
              <button className='btn btn-success' style={{ fontSize: '0.82rem', padding: '8px 16px', fontWeight: 700 }}
                disabled={salvando}
                onClick={() => onFinalizar(item.consulta_id, item.paciente?.id, form, setSalvando)}>
                ✓ Finalizar — paciente saiu
              </button>
            </div>
          )}
          {finalizado && (
            <div style={{ marginTop: '14px', fontSize: '0.8rem', color: '#4ade80', fontStyle: 'italic' }}>
              ✅ Pós-atendimento concluído.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PosAtendimento() {
  const [itens,   setItens]   = useState([])
  const [loading, setLoading] = useState(true)
  const [data,    setData]    = useState(new Date().toISOString().split('T')[0])
  const [mostrarConcluidos, setMostrarConcluidos] = useState(false)
  const [modal,   setModal]   = useState(null)
  const { toast, ToastUI }             = useToast()
  const { confirmar, ConfirmModalUI }  = useConfirm()

  const carregar = useCallback(async (d) => {
    setLoading(true)
    try {
      const { data: res } = await api.get(`/pos-atendimento?data=${d}`)
      setItens(res || [])
    } catch (err) {
      toast('Erro ao carregar: ' + (err.response?.data?.error || err.message), 'error')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar(data) }, [data])

  const handleSalvar = async (consulta_id, paciente_id, form, setSalvando) => {
    setSalvando(true)
    try {
      await api.post('/pos-atendimento', { consulta_id, paciente_id, ...form })
      toast('Checklist salvo!', 'success'); carregar(data)
    } catch (err) {
      toast('Erro: ' + (err.response?.data?.error || err.message), 'error')
    } finally { setSalvando(false) }
  }

  const handleFinalizar = async (consulta_id, paciente_id, form, setSalvando) => {
    const ok = await confirmar({
      titulo: 'Finalizar pós-atendimento',
      mensagem: 'Confirma que o paciente saiu e o checklist está completo?',
      labelOk: 'Sim, finalizar', tipo: 'success',
    })
    if (!ok) return
    setSalvando(true)
    try {
      const { data: saved } = await api.post('/pos-atendimento', { consulta_id, paciente_id, ...form })
      await api.patch(`/pos-atendimento/${saved.id}/finalizar`)
      toast('Paciente finalizado! ✅', 'success'); carregar(data)
    } catch (err) {
      toast('Erro: ' + (err.response?.data?.error || err.message), 'error')
    } finally { setSalvando(false) }
  }

  const pendentes  = itens.filter(i => !i.pos_atendimento?.finalizado)
  const concluidos = itens.filter(i =>  i.pos_atendimento?.finalizado)
  const semRegistro = itens.filter(i => !i.pos_atendimento)
  const exibir     = mostrarConcluidos ? itens : pendentes

  return (
    <PageLayout title='🏥 Pós-Atendimento'>
      <ToastUI /><ConfirmModalUI />

      {/* Modal de agendamento de retorno */}
      <ModalAgendarRetorno
        aberto={!!modal}
        onFechar={() => setModal(null)}
        onAgendado={() => { setModal(null); carregar(data) }}
        paciente_id={modal?.paciente_id}
        paciente_nome={modal?.paciente_nome}
        motivo_sugerido={modal?.motivo}
        retorno_dias={modal?.retorno_dias}
      />

      <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
        Fila de pacientes liberados pelo médico aguardando finalização da recepção:
        entrega de documentos, cobrança e agendamento de retorno.
      </p>

      {/* Cards resumo */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '22px' }}>
        {[
          { label: 'Na fila',     value: pendentes.length,   color: '#fbbf24', emoji: '⏳' },
          { label: 'Concluídos',  value: concluidos.length,  color: '#4ade80', emoji: '✅' },
          { label: 'Sem início',  value: semRegistro.length, color: '#f87171', emoji: '🔴' },
          { label: 'Total',       value: itens.length,       color: '#94a3b8', emoji: '📋' },
        ].map(c => (
          <div key={c.label} style={{
            flex: '1 1 110px', padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px' }}>{c.emoji} {c.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className='inner-toolbar' style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>📅 Data:</label>
          <input type='date' className='form-input' style={{ maxWidth: '160px' }}
            value={data} onChange={e => setData(e.target.value)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}>
          <input type='checkbox' checked={mostrarConcluidos}
            onChange={e => setMostrarConcluidos(e.target.checked)}
            style={{ accentColor: '#4ade80' }} />
          Mostrar concluídos
        </label>
        <button className='btn btn-secondary' onClick={() => carregar(data)}>🔄 Atualizar</button>
      </div>

      {loading && <p className='page-loading'>Carregando fila...</p>}

      {!loading && exibir.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#334155', fontSize: '0.88rem' }}>
          {pendentes.length === 0 && concluidos.length === 0
            ? '🎉 Nenhum paciente liberado pelo médico nesta data.'
            : '✅ Todos os pacientes já foram finalizados!'}
        </div>
      )}

      {!loading && exibir.map(item => (
        <CardPaciente
          key={item.consulta_id}
          item={item}
          onSalvar={handleSalvar}
          onFinalizar={handleFinalizar}
          onAbrirModal={setModal}
        />
      ))}
    </PageLayout>
  )
}
