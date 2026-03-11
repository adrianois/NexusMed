import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import '../InnerPage.css'

export default function MedicoHistorico() {
  const [historico,  setHistorico]  = useState([])
  const [pacientes,  setPacientes]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [busca,      setBusca]      = useState('')
  const nav = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/medico/historico'),
      api.get('/pacientes'),
    ]).then(([rh, rp]) => {
      setHistorico(rh.data || [])
      setPacientes(rp.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const nomePaciente = id => pacientes.find(p => p.id === id)?.nome || '—'

  const filtrados = historico.filter(h =>
    !busca ||
    nomePaciente(h.paciente_id).toLowerCase().includes(busca.toLowerCase()) ||
    h.diagnostico?.toLowerCase().includes(busca.toLowerCase()) ||
    h.cid10?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <PageLayout title='📁 Histórico de Atendimentos'>

      <div className='inner-toolbar'>
        <input className='form-input' style={{ maxWidth: '280px' }}
          placeholder='🔍 Buscar por paciente ou diagnóstico...'
          value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {loading && <p className='page-loading'>⏳ Carregando histórico...</p>}

      {!loading && filtrados.length === 0 && (
        <div className='page-vazio-box'>
          <span className='page-vazio-icon'>📁</span>
          <p>Nenhum atendimento registrado.</p>
        </div>
      )}

      {!loading && filtrados.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtrados.map(h => (
            <div key={h.id} style={{
              background: 'linear-gradient(145deg,#111827,#0f172a)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: '4px solid #60a5fa',
              borderRadius: '12px', padding: '16px 20px',
              display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center',
            }}>
              <div style={{ minWidth: '90px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>
                  {h.data_atendimento ? new Date(h.data_atendimento+'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </div>
                <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: '2px' }}>data</div>
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.93rem' }}>
                  {nomePaciente(h.paciente_id)}
                </div>
                {h.diagnostico && (
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                    🏥 {h.diagnostico} {h.cid10 && <span style={{ color: '#475569' }}>({h.cid10})</span>}
                  </div>
                )}
                {h.consultas?.motivo && (
                  <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: '2px', fontStyle: 'italic' }}>
                    {h.consultas.motivo}
                  </div>
                )}
              </div>
              {h.retorno_dias && (
                <div style={{
                  background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
                  borderRadius: '8px', padding: '6px 12px', textAlign: 'center',
                  fontSize: '0.72rem', color: '#60a5fa',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{h.retorno_dias}</div>
                  <div>dias</div>
                </div>
              )}
              <button className='btn btn-secondary' style={{ fontSize: '0.8rem', padding: '7px 14px' }}
                onClick={() => nav(`/medico/atendimento/${h.consulta_id}`)}>
                👁️ Ver
              </button>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
