import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import { useToast } from '../../components/Toast'
import '../InnerPage.css'

const FORM_VAZIO = {
  anamnese: '', exame_fisico: '', diagnostico: '', cid10: '',
  conduta: '', prescricao: '', retorno_dias: '', observacoes: '',
}

const sectionTitle = (label) => (
  <div style={{
    fontSize: '0.68rem', fontWeight: 700, color: '#60a5fa',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: '12px', paddingBottom: '8px',
    borderBottom: '1px solid rgba(96,165,250,0.15)',
  }}>{label}</div>
)

export default function MedicoAtendimento() {
  const { consulta_id } = useParams()
  const nav = useNavigate()
  const { toast, ToastUI } = useToast()

  const [consulta,  setConsulta]  = useState(null)
  const [paciente,  setPaciente]  = useState(null)
  const [form,      setForm]      = useState(FORM_VAZIO)
  const [salvando,  setSalvando]  = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [soLeitura, setSoLeitura] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        // Iniciar atendimento (muda status para em_atendimento)
        const [rc, rpront] = await Promise.all([
          api.get(`/medico/agenda`).then(r =>
            r.data.find ? Promise.resolve(r) : Promise.resolve(r)
          ),
          api.get(`/medico/atendimento/${consulta_id}`),
        ])
        // Busca dados da consulta
        const rcons = await api.get(`/medico/agenda`)
        const cons  = rcons.data.find ? rcons.data : []
        // Busca de todas as consultas pelo ID
        const rcFull = await api.get(`/consultas`).catch(() => ({ data: [] }))
        const c = (rcFull.data || []).find(x => String(x.id) === String(consulta_id))
        setConsulta(c)
        if (c?.status === 'liberada') setSoLeitura(true)
        // Busca paciente
        if (c?.paciente_id) {
          const rp = await api.get(`/pacientes`)
          setPaciente((rp.data || []).find(p => p.id === c.paciente_id) || null)
        }
        // Carrega prontuário existente
        if (rpront.data) {
          const d = rpront.data
          setForm({
            anamnese:    d.anamnese    || '',
            exame_fisico:d.exame_fisico|| '',
            diagnostico: d.diagnostico || '',
            cid10:       d.cid10       || '',
            conduta:     d.conduta     || '',
            prescricao:  d.prescricao  || '',
            retorno_dias:d.retorno_dias|| '',
            observacoes: d.observacoes || '',
          })
          if (c?.status !== 'liberada') setSoLeitura(false)
        }
        // Inicia atendimento se ainda não iniciado
        if (c && !['em_atendimento','liberada'].includes(c.status)) {
          await api.post(`/medico/atendimento/${consulta_id}/iniciar`).catch(() => {})
        }
      } catch (e) { toast('Erro ao carregar: ' + e.message, 'error') }
      finally { setLoading(false) }
    }
    init()
  }, [consulta_id])

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const salvar = async (finalizar = false) => {
    setSalvando(true)
    try {
      await api.post(`/medico/atendimento/${consulta_id}/finalizar`, form)
      toast(finalizar ? 'Atendimento finalizado!' : 'Rascunho salvo!', 'success')
      if (finalizar) setTimeout(() => nav('/medico/triagem'), 1200)
    } catch (e) { toast('Erro: ' + (e.response?.data?.error || e.message), 'error') }
    finally { setSalvando(false) }
  }

  return (
    <PageLayout title='📋 Registro de Atendimento'>
      <ToastUI />

      {loading && <p className='page-loading'>⏳ Carregando...</p>}

      {!loading && (
        <>
          {/* Cabeçalho do paciente */}
          {(consulta || paciente) && (
            <div style={{
              background: 'linear-gradient(145deg,#111827,#0f172a)',
              border: '1px solid rgba(96,165,250,0.15)',
              borderRadius: '14px', padding: '18px 22px', marginBottom: '22px',
              display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e2e8f0' }}>
                  👤 {paciente?.nome || '—'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {paciente?.data_nascimento && <span>🎂 {new Date(paciente.data_nascimento+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                  {paciente?.telefone && <span>📱 {paciente.telefone}</span>}
                  {paciente?.plano_saude && <span>🏥 {paciente.plano_saude}</span>}
                </div>
              </div>
              {consulta && (
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                  <div>📅 {new Date((consulta.data_consulta||'')+'T12:00:00').toLocaleDateString('pt-BR')}</div>
                  <div>⏰ {consulta.horario || '—'}</div>
                  <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#475569' }}>{consulta.motivo}</div>
                </div>
              )}
            </div>
          )}

          {/* Triagem */}
          {consulta?.triagem_queixa && (
            <div style={{
              background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>🩺 Dados da Triagem</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                {consulta.triagem_pressao       && <span>🩸 PA: {consulta.triagem_pressao}</span>}
                {consulta.triagem_temperatura   && <span>🌡️ Temp: {consulta.triagem_temperatura}°C</span>}
                {consulta.triagem_saturacao     && <span>💧 SpO₂: {consulta.triagem_saturacao}%</span>}
                {consulta.triagem_freq_cardiaca && <span>❤️ FC: {consulta.triagem_freq_cardiaca}bpm</span>}
                {consulta.triagem_peso          && <span>⚖️ Peso: {consulta.triagem_peso}kg</span>}
                {consulta.triagem_altura        && <span>📏 Alt: {consulta.triagem_altura}cm</span>}
              </div>
              {consulta.triagem_queixa && (
                <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <strong style={{ color: '#a78bfa' }}>Queixa:</strong> {consulta.triagem_queixa}
                </div>
              )}
            </div>
          )}

          {/* Formulário de atendimento */}
          <div style={{
            background: 'linear-gradient(145deg,#111827,#0f172a)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', padding: '24px 28px',
          }}>
            <div style={{ marginBottom: '22px' }}>
              {sectionTitle('📝 Anamnese')}
              <textarea className='form-textarea' name='anamnese' value={form.anamnese} onChange={handle}
                rows={4} disabled={soLeitura} placeholder='Histórico, queixa principal, HDA, ISDA...'
                style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '22px' }}>
              {sectionTitle('🔬 Exame Físico')}
              <textarea className='form-textarea' name='exame_fisico' value={form.exame_fisico} onChange={handle}
                rows={3} disabled={soLeitura} placeholder='Exame físico geral e específico...'
                style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '22px' }}>
              {sectionTitle('🏥 Diagnóstico')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '0' }}>
                <div>
                  <label className='form-label' style={{ fontSize: '0.72rem', marginBottom: '5px', display: 'block' }}>Diagnóstico</label>
                  <input className='form-input' name='diagnostico' value={form.diagnostico} onChange={handle}
                    disabled={soLeitura} placeholder='Diagnóstico clínico...' style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label className='form-label' style={{ fontSize: '0.72rem', marginBottom: '5px', display: 'block' }}>CID-10</label>
                  <input className='form-input' name='cid10' value={form.cid10} onChange={handle}
                    disabled={soLeitura} placeholder='Ex: J06.9' style={{ width: '120px' }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              {sectionTitle('💊 Conduta e Prescrição')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className='form-label' style={{ fontSize: '0.72rem', marginBottom: '5px', display: 'block' }}>Conduta</label>
                  <textarea className='form-textarea' name='conduta' value={form.conduta} onChange={handle}
                    rows={3} disabled={soLeitura} placeholder='Conduta adotada...'
                    style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label className='form-label' style={{ fontSize: '0.72rem', marginBottom: '5px', display: 'block' }}>Prescrição</label>
                  <textarea className='form-textarea' name='prescricao' value={form.prescricao} onChange={handle}
                    rows={3} disabled={soLeitura} placeholder='Medicamentos, dosagens...'
                    style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              {sectionTitle('📌 Retorno e Observações')}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px', alignItems: 'start' }}>
                <div>
                  <label className='form-label' style={{ fontSize: '0.72rem', marginBottom: '5px', display: 'block' }}>Retorno em (dias)</label>
                  <input className='form-input' name='retorno_dias' value={form.retorno_dias} onChange={handle}
                    type='number' min='0' disabled={soLeitura} placeholder='Ex: 30' style={{ width: '100px' }} />
                </div>
                <div>
                  <label className='form-label' style={{ fontSize: '0.72rem', marginBottom: '5px', display: 'block' }}>Observações</label>
                  <textarea className='form-textarea' name='observacoes' value={form.observacoes} onChange={handle}
                    rows={2} disabled={soLeitura} placeholder='Observações adicionais...'
                    style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {!soLeitura && (
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button className='btn btn-success' disabled={salvando}
                  style={{ flex: 1, padding: '12px', fontSize: '0.92rem', fontWeight: 700 }}
                  onClick={() => salvar(true)}>
                  {salvando ? '⏳ Salvando...' : '✓ Finalizar Atendimento'}
                </button>
                <button className='btn btn-secondary' disabled={salvando}
                  style={{ padding: '12px 18px' }}
                  onClick={() => salvar(false)}>
                  💾 Salvar Rascunho
                </button>
                <button className='btn btn-secondary' style={{ padding: '12px 18px' }}
                  onClick={() => nav(-1)}>← Voltar</button>
              </div>
            )}
            {soLeitura && (
              <button className='btn btn-secondary' style={{ padding: '11px 20px' }}
                onClick={() => nav(-1)}>← Voltar</button>
            )}
          </div>
        </>
      )}
    </PageLayout>
  )
}
