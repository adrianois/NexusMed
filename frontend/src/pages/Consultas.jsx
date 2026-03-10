import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import './InnerPage.css'

const DIAS_SEMANA = ['dom','seg','ter','qua','qui','sex','sab']
const FORM_INICIAL = { paciente_id:'', medico_id:'', horario_selecionado:'', data_consulta:'', motivo:'', observacoes:'' }

const STATUS_CONFIG = {
  agendada:  { label: 'Agendada',   bg: '#1e3a5f', color: '#93c5fd', emoji: '🗓️' },
  confirmada:{ label: 'Confirmada', bg: '#14532d', color: '#86efac', emoji: '✅' },
  liberada:  { label: 'Liberada',   bg: '#3b0764', color: '#d8b4fe', emoji: '🔓' },
}

export default function Consultas() {
  const [consultas,setConsultas]     = useState([])
  const [pacientes,setPacientes]     = useState([])
  const [medicos,setMedicos]         = useState([])
  const [loading,setLoading]         = useState(true)
  const [erro,setErro]               = useState(null)
  const [mostrarForm,setMostrarForm] = useState(false)
  const [salvando,setSalvando]       = useState(false)
  const [form,setForm]               = useState(FORM_INICIAL)
  const [editandoId,setEditandoId]   = useState(null)
  const [horariosDisponiveis,setHorariosDisponiveis] = useState([])
  const [alterandoStatus,setAlterandoStatus] = useState(null)

  const carregar = () => {
    setLoading(true)
    Promise.all([api.get('/consultas'),api.get('/pacientes'),api.get('/medicos')])
      .then(([c,p,m])=>{ setConsultas(c.data||[]); setPacientes(p.data||[]); setMedicos((m.data||[]).filter(x=>x.ativo!==false)) })
      .catch(()=>setErro('Erro ao carregar dados.'))
      .finally(()=>setLoading(false))
  }
  useEffect(()=>{carregar()},[]) 

  useEffect(()=>{
    if (!form.medico_id||!form.data_consulta){setHorariosDisponiveis([]);return}
    const medico = medicos.find(m=>m.id===form.medico_id)
    if (!medico?.agenda){setHorariosDisponiveis([]);return}
    const dia = DIAS_SEMANA[new Date(form.data_consulta+'T12:00:00').getDay()]
    const agenda = medico.agenda[dia]||[]
    const ocupados = consultas
      .filter(c=>c.medico_id===form.medico_id&&c.data_consulta===form.data_consulta&&c.id!==editandoId&&c.status!=='liberada')
      .map(c=>c.horario)
    setHorariosDisponiveis(agenda.filter(h=>!ocupados.includes(h)))
    setForm(prev=>({...prev,horario_selecionado:''}))
  },[form.medico_id,form.data_consulta])

  const handleChange = e => setForm(prev=>({...prev,[e.target.name]:e.target.value}))

  const abrirEdicao = c => {
    setForm({ paciente_id:c.paciente_id||'', medico_id:c.medico_id||'',
      horario_selecionado:c.horario||'', data_consulta:c.data_consulta||'',
      motivo:c.motivo||'', observacoes:c.observacoes||'' })
    setEditandoId(c.id); setMostrarForm(true); window.scrollTo({top:0,behavior:'smooth'})
  }

  const cancelar = () => { setMostrarForm(false); setForm(FORM_INICIAL); setEditandoId(null) }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.paciente_id||!form.data_consulta||!form.motivo) return alert('Paciente, data e motivo são obrigatórios!')
    if (form.medico_id&&!form.horario_selecionado) return alert('Selecione um horário disponível!')
    setSalvando(true)
    try {
      const payload = { paciente_id:form.paciente_id, medico_id:form.medico_id||null,
        data_consulta:form.data_consulta, horario:form.horario_selecionado||null,
        motivo:form.motivo, observacoes:form.observacoes }
      if (editandoId) await api.put(`/consultas/${editandoId}`, payload)
      else            await api.post('/consultas', payload)
      cancelar(); carregar()
    } catch (err) { alert('Erro: '+(err.response?.data?.error||err.message)) }
    finally { setSalvando(false) }
  }

  const alterarStatus = async (c, novoStatus) => {
    if (alterandoStatus) return
    const msgs = {
      confirmada: `Confirmar a consulta de "${getNome(pacientes,c.paciente_id)}"?`,
      liberada:   `Liberar o horário ${c.horario||''} de "${getNome(pacientes,c.paciente_id)}"?\nO horário ficará disponível para outro paciente.`,
      agendada:   `Reabrir a consulta de "${getNome(pacientes,c.paciente_id)}" como agendada?`,
    }
    if (!confirm(msgs[novoStatus])) return
    setAlterandoStatus(c.id)
    try {
      await api.patch(`/consultas/${c.id}/status`, { status: novoStatus })
      carregar()
    } catch (err) { alert('Erro: '+(err.response?.data?.error||err.message)) }
    finally { setAlterandoStatus(null) }
  }

  const excluir = async c => {
    const nomePaciente = pacientes.find(p=>p.id===c.paciente_id)?.nome||''
    if (!confirm(`Excluir a consulta de "${nomePaciente}" em ${formatarData(c.data_consulta)} às ${c.horario||'?'}?`)) return
    try { await api.delete(`/consultas/${c.id}`); carregar() }
    catch (err) { alert(`❌ ${err.response?.data?.error||err.message}`) }
  }

  const getNome = (lista,id) => lista.find(x=>x.id===id)?.nome||'—'
  const formatarData = d => { if(!d) return '—'; const [a,m,dia]=d.split('-'); return `${dia}/${m}/${a}` }
  const medicoSel = medicos.find(m=>m.id===form.medico_id)
  const getStatus = s => STATUS_CONFIG[s] || STATUS_CONFIG.agendada

  return (
    <PageLayout title='📅 Consultas'>
      <div className='inner-toolbar'>
        <button className={`btn ${mostrarForm?'btn-secondary':'btn-primary'}`} onClick={()=>{if(mostrarForm)cancelar();else setMostrarForm(true)}}>
          {mostrarForm?'✖ Cancelar':'+ Nova Consulta'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>{editandoId?'✏️ Editar Consulta':'Agendar Nova Consulta'}</h3>
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
                <option value=''>-- Selecione --</option>
                {medicos.map(m=><option key={m.id} value={m.id}>{m.nome}{m.especialidade?` — ${m.especialidade}`:''}</option>)}
              </select>
            </div>
            <div className='form-field'>
              <label className='form-label'>Data <span className='required'>*</span></label>
              <input className='form-input' type='date' name='data_consulta' value={form.data_consulta} onChange={handleChange} required />
            </div>
            {form.medico_id&&form.data_consulta&&(
              <div className='form-field form-field--full'>
                <label className='form-label'>Horário Disponível <span className='required'>*</span> {medicoSel&&<span style={{color:'#64748b',fontWeight:400,fontSize:'0.8rem'}}>({medicoSel.nome})</span>}</label>
                {horariosDisponiveis.length===0
                  ? <div style={{padding:'10px',background:'#451a03',borderRadius:'6px',color:'#fbbf24',fontSize:'0.8rem'}}>⚠️ Nenhum horário disponível nesta data.</div>
                  : <div style={{display:'flex',flexWrap:'wrap',gap:'7px',paddingTop:'4px'}}>
                      {horariosDisponiveis.map(h=>(
                        <button key={h} type='button' onClick={()=>setForm(prev=>({...prev,horario_selecionado:h}))}
                          style={{padding:'7px 14px',borderRadius:'6px',cursor:'pointer',border:'1px solid',fontSize:'0.86rem',fontWeight:600,
                            background:form.horario_selecionado===h?'#1e40af':'#1e293b',
                            color:form.horario_selecionado===h?'#93c5fd':'#94a3b8',
                            borderColor:form.horario_selecionado===h?'#3b82f6':'#334155'}}>{h}</button>
                      ))}
                    </div>
                }
              </div>
            )}
            {(!form.medico_id||!form.data_consulta)&&(
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
              <button type='submit' className='btn btn-success' disabled={salvando}>{salvando?'Salvando...':editandoId?'✓ Salvar Alterações':'✓ Confirmar Agendamento'}</button>
              <button type='button' className='btn btn-secondary' onClick={cancelar}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {erro    && <p className='page-erro'>{erro}</p>}

      {!loading && !erro && (
        consultas.length===0
          ? (<div className='page-vazio-box'><span className='page-vazio-icon'>📅</span><p>Nenhuma consulta agendada.</p><button className='btn btn-primary' onClick={()=>setMostrarForm(true)}>+ Agendar</button></div>)
          : (
            <div className='table-wrapper'>
              <table className='data-table'>
                <thead><tr><th>Paciente</th><th>Médico</th><th>Data</th><th>Horário</th><th>Motivo</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  {consultas.sort((a,b)=>(a.data_consulta+a.horario)>(b.data_consulta+b.horario)?1:-1).map(c=>{
                    const st = getStatus(c.status)
                    const isLiberada = c.status==='liberada'
                    return (
                    <tr key={c.id} style={isLiberada?{opacity:0.55}:{}}>
                      <td style={{fontWeight:600}}>{getNome(pacientes,c.paciente_id)}</td>
                      <td style={{color:'#94a3b8'}}>{c.medico_id?getNome(medicos,c.medico_id):<span style={{color:'#475569'}}>Não informado</span>}</td>
                      <td>{formatarData(c.data_consulta)}</td>
                      <td>
                        {isLiberada
                          ? <span style={{background:'#3b0764',color:'#d8b4fe',padding:'2px 8px',borderRadius:'4px',fontSize:'0.8rem',fontWeight:600,textDecoration:'line-through'}}>{c.horario||'—'}</span>
                          : <span style={{background:'#1e3a5f',color:'#93c5fd',padding:'2px 8px',borderRadius:'4px',fontSize:'0.8rem',fontWeight:600}}>{c.horario||'—'}</span>
                        }
                      </td>
                      <td style={{fontSize:'0.88rem'}}>{c.motivo}</td>
                      <td>
                        <span style={{background:st.bg,color:st.color,padding:'3px 9px',borderRadius:'12px',fontSize:'0.75rem',fontWeight:700,whiteSpace:'nowrap'}}>
                          {st.emoji} {st.label}
                        </span>
                      </td>
                      <td>
                        <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                          {!isLiberada && c.status!=='confirmada' && (
                            <button
                              className='btn'
                              style={{fontSize:'0.72rem',padding:'4px 9px',background:'#14532d',color:'#86efac',border:'1px solid #166534'}}
                              disabled={alterandoStatus===c.id}
                              onClick={()=>alterarStatus(c,'confirmada')}>
                              ✅ Confirmar
                            </button>
                          )}
                          {!isLiberada && (
                            <button
                              className='btn'
                              style={{fontSize:'0.72rem',padding:'4px 9px',background:'#4c1d95',color:'#ddd6fe',border:'1px solid #5b21b6'}}
                              disabled={alterandoStatus===c.id}
                              onClick={()=>alterarStatus(c,'liberada')}>
                              🔓 Liberar
                            </button>
                          )}
                          {isLiberada && (
                            <button
                              className='btn'
                              style={{fontSize:'0.72rem',padding:'4px 9px',background:'#1e3a5f',color:'#93c5fd',border:'1px solid #1d4ed8'}}
                              disabled={alterandoStatus===c.id}
                              onClick={()=>alterarStatus(c,'agendada')}>
                              🗓️ Reagendar
                            </button>
                          )}
                          {!isLiberada && (
                            <button className='btn btn-primary' style={{fontSize:'0.72rem',padding:'4px 9px'}} onClick={()=>abrirEdicao(c)}>✏️ Editar</button>
                          )}
                          <button className='btn btn-danger' style={{fontSize:'0.72rem',padding:'4px 9px'}} onClick={()=>excluir(c)}>🗑️ Excluir</button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )
      )}
    </PageLayout>
  )
}
