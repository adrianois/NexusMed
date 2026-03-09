import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import './InnerPage.css'

const DIAS_SEMANA = ['dom','seg','ter','qua','qui','sex','sab']
const FORM_INICIAL = { paciente_id:'', medico_id:'', horario_selecionado:'', data_consulta:'', motivo:'', observacoes:'' }

export default function Consultas() {
  const [consultas, setConsultas]     = useState([])
  const [pacientes, setPacientes]     = useState([])
  const [medicos, setMedicos]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [form, setForm]               = useState(FORM_INICIAL)
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([])

  const carregarDados = () => {
    setLoading(true)
    Promise.all([api.get('/consultas'), api.get('/pacientes'), api.get('/medicos')])
      .then(([c,p,m]) => {
        setConsultas(c.data||[])
        setPacientes(p.data||[])
        setMedicos((m.data||[]).filter(x=>x.ativo!==false))
      })
      .catch(() => setErro('Erro ao carregar dados.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregarDados() }, [])

  // Atualiza horários disponíveis quando muda médico ou data
  useEffect(() => {
    if (!form.medico_id || !form.data_consulta) { setHorariosDisponiveis([]); return }
    const medico = medicos.find(m => m.id === form.medico_id)
    if (!medico?.agenda) { setHorariosDisponiveis([]); return }
    const diaSemana = DIAS_SEMANA[new Date(form.data_consulta + 'T12:00:00').getDay()]
    const horariosAgenda = medico.agenda[diaSemana] || []
    // Remove horários já agendados para esse médico nessa data
    const agendados = consultas
      .filter(c => c.medico_id === form.medico_id && c.data_consulta === form.data_consulta)
      .map(c => c.horario)
    setHorariosDisponiveis(horariosAgenda.filter(h => !agendados.includes(h)))
    setForm(prev => ({ ...prev, horario_selecionado: '' }))
  }, [form.medico_id, form.data_consulta])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.paciente_id || !form.data_consulta || !form.motivo) return alert('Paciente, data e motivo são obrigatórios!')
    if (form.medico_id && !form.horario_selecionado) return alert('Selecione um horário disponível!')
    setSalvando(true)
    try {
      await api.post('/consultas', {
        paciente_id:  form.paciente_id,
        medico_id:    form.medico_id || null,
        data_consulta:form.data_consulta,
        horario:      form.horario_selecionado || null,
        motivo:       form.motivo,
        observacoes:  form.observacoes
      })
      setForm(FORM_INICIAL)
      setMostrarForm(false)
      carregarDados()
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message))
    } finally { setSalvando(false) }
  }

  const getNome = (lista, id) => lista.find(x=>x.id===id)?.nome||'—'
  const formatarData = d => { if(!d) return '—'; const [a,m,dia]=d.split('-'); return `${dia}/${m}/${a}` }

  const medicoSelecionado = medicos.find(m => m.id === form.medico_id)

  return (
    <PageLayout title='📅 Consultas'>
      <div className='inner-toolbar'>
        <button className={`btn ${mostrarForm?'btn-secondary':'btn-primary'}`} onClick={()=>setMostrarForm(!mostrarForm)}>
          {mostrarForm ? '✖ Cancelar' : '+ Nova Consulta'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>Agendar Nova Consulta</h3>
          <form onSubmit={handleSubmit} className='inner-form'>

            <div className='form-field form-field--full'>
              <label className='form-label'>Paciente <span className='required'>*</span></label>
              <select className='form-select' name='paciente_id' value={form.paciente_id} onChange={handleChange} required>
                <option value=''>Selecione um paciente</option>
                {pacientes.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <div className='form-field'>
              <label className='form-label'>Médico Responsável</label>
              <select className='form-select' name='medico_id' value={form.medico_id} onChange={handleChange}>
                <option value=''>-- Selecione um médico --</option>
                {medicos.map(m=>(
                  <option key={m.id} value={m.id}>{m.nome}{m.especialidade?` — ${m.especialidade}`:''}</option>
                ))}
              </select>
            </div>

            <div className='form-field'>
              <label className='form-label'>Data da Consulta <span className='required'>*</span></label>
              <input className='form-input' type='date' name='data_consulta' value={form.data_consulta} onChange={handleChange} required />
            </div>

            {/* Horários disponíveis */}
            {form.medico_id && form.data_consulta && (
              <div className='form-field form-field--full'>
                <label className='form-label'>
                  Horário Disponível <span className='required'>*</span>
                  {medicoSelecionado && <span style={{color:'#64748b',fontWeight:400,marginLeft:'6px'}}>({medicoSelecionado.nome})</span>}
                </label>
                {horariosDisponiveis.length === 0
                  ? (
                    <div style={{ padding:'12px', background:'#451a03', borderRadius:'6px', color:'#fbbf24', fontSize:'0.82rem' }}>
                      ⚠️ Nenhum horário disponível para este médico nesta data.
                      {medicoSelecionado && !medicoSelecionado.agenda && ' (Médico sem agenda configurada)'}
                    </div>
                  )
                  : (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', padding:'4px 0' }}>
                      {horariosDisponiveis.map(h => (
                        <button key={h} type='button'
                          onClick={() => setForm(prev=>({...prev, horario_selecionado:h}))}
                          style={{
                            padding:'8px 16px', borderRadius:'6px', cursor:'pointer', border:'1px solid', fontSize:'0.88rem', fontWeight:600,
                            background: form.horario_selecionado===h ? '#1e40af' : '#1e293b',
                            color:      form.horario_selecionado===h ? '#93c5fd' : '#94a3b8',
                            borderColor:form.horario_selecionado===h ? '#3b82f6' : '#334155',
                          }}>
                          {h}
                        </button>
                      ))}
                    </div>
                  )
                }
              </div>
            )}

            {(!form.medico_id || !form.data_consulta) && (
              <div className='form-field'>
                <label className='form-label'>Horário</label>
                <input className='form-input' type='time' name='horario_selecionado' value={form.horario_selecionado} onChange={handleChange} />
              </div>
            )}

            <div className='form-field form-field--full'>
              <label className='form-label'>Motivo <span className='required'>*</span></label>
              <input className='form-input' type='text' name='motivo' value={form.motivo} onChange={handleChange} placeholder='Ex: Consulta de rotina...' required />
            </div>

            <div className='form-field form-field--full'>
              <label className='form-label'>Observações</label>
              <textarea className='form-textarea' name='observacoes' rows={3} value={form.observacoes} onChange={handleChange} placeholder='Anotações adicionais...' />
            </div>

            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>{salvando?'Salvando...':'✓ Confirmar Agendamento'}</button>
              <button type='button' className='btn btn-secondary' onClick={()=>{setMostrarForm(false);setForm(FORM_INICIAL)}}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {erro    && <p className='page-erro'>{erro}</p>}

      {!loading && !erro && (
        consultas.length === 0
          ? (<div className='page-vazio-box'><span className='page-vazio-icon'>📅</span><p>Nenhuma consulta agendada ainda.</p><button className='btn btn-primary' onClick={()=>setMostrarForm(true)}>+ Agendar primeira consulta</button></div>)
          : (
            <div className='table-wrapper'>
              <table className='data-table'>
                <thead><tr><th>Paciente</th><th>Médico</th><th>Data</th><th>Horário</th><th>Motivo</th><th>Observações</th></tr></thead>
                <tbody>
                  {consultas
                    .sort((a,b) => (a.data_consulta+a.horario) > (b.data_consulta+b.horario) ? 1 : -1)
                    .map(c => (
                    <tr key={c.id}>
                      <td style={{fontWeight:600}}>{getNome(pacientes, c.paciente_id)}</td>
                      <td style={{color:'#94a3b8'}}>{c.medico_id ? getNome(medicos,c.medico_id) : <span style={{color:'#475569'}}>Não informado</span>}</td>
                      <td>{formatarData(c.data_consulta)}</td>
                      <td><span style={{ background:'#1e3a5f', color:'#93c5fd', padding:'2px 8px', borderRadius:'4px', fontSize:'0.82rem', fontWeight:600 }}>{c.horario||'—'}</span></td>
                      <td>{c.motivo}</td>
                      <td style={{color:'#64748b',fontSize:'0.85rem'}}>{c.observacoes||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}
    </PageLayout>
  )
}
