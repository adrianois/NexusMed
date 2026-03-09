import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import './InnerPage.css'

const ESPECIALIDADES = [
  'Clínico Geral','Cardiologia','Dermatologia','Endocrinologia','Gastroenterologia',
  'Ginecologia','Neurologia','Oftalmologia','Ortopedia','Otorrinolaringologia',
  'Pediatria','Psiquiatria','Urologia','Outras'
]
const DIAS = [
  {key:'seg',label:'Segunda'},{key:'ter',label:'Terça'},{key:'qua',label:'Quarta'},
  {key:'qui',label:'Quinta'},{key:'sex',label:'Sexta'},{key:'sab',label:'Sábado'},{key:'dom',label:'Domingo'}
]
const TODOS_HORARIOS = (() => {
  const l=[]; let h=7,m=0
  while(h*60+m<=20*60){ l.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`); m+=30; if(m>=60){h++;m=0} }
  return l
})()

const FORM_INICIAL = { nome:'',crm:'',especialidade:'',telefone:'',email:'', agenda:{seg:[],ter:[],qua:[],qui:[],sex:[],sab:[],dom:[]} }

function AgendaEditor({ agenda, onChange }) {
  const toggle = (dia,hora) => {
    const atual = agenda[dia]||[]
    onChange({...agenda,[dia]: atual.includes(hora)?atual.filter(h=>h!==hora):[...atual,hora].sort()})
  }
  const copiar = (orig) => {
    const na={...agenda}
    DIAS.map(d=>d.key).filter(k=>k!==orig&&!['sab','dom'].includes(k)).forEach(k=>{na[k]=[...(agenda[orig]||[])]})
    onChange(na)
  }
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
      {DIAS.map(({key,label})=>(
        <div key={key} style={{background:'#0f172a',borderRadius:'8px',padding:'10px 12px',border:'1px solid #1e293b'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
            <span style={{color:'#38bdf8',fontWeight:700,fontSize:'0.8rem',textTransform:'uppercase'}}>{label} <span style={{color:'#475569',fontWeight:400}}>({(agenda[key]||[]).length})</span></span>
            <div style={{display:'flex',gap:'5px'}}>
              <button type='button' onClick={()=>onChange({...agenda,[key]:[]})} style={{fontSize:'0.68rem',padding:'2px 7px',background:'#450a0a',color:'#f87171',border:'1px solid #7f1d1d',borderRadius:'4px',cursor:'pointer'}}>Limpar</button>
              <button type='button' onClick={()=>copiar(key)} style={{fontSize:'0.68rem',padding:'2px 7px',background:'#1e3a5f',color:'#38bdf8',border:'1px solid #1d4ed8',borderRadius:'4px',cursor:'pointer'}}>Copiar→úteis</button>
            </div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
            {TODOS_HORARIOS.map(hora=>{
              const sel=(agenda[key]||[]).includes(hora)
              return <button key={hora} type='button' onClick={()=>toggle(key,hora)}
                style={{padding:'3px 9px',fontSize:'0.73rem',borderRadius:'4px',cursor:'pointer',border:'1px solid',
                  background:sel?'#1e40af':'#1e293b',color:sel?'#93c5fd':'#64748b',borderColor:sel?'#3b82f6':'#334155',fontWeight:sel?700:400}}>{hora}</button>
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Medicos() {
  const [medicos,setMedicos]         = useState([])
  const [loading,setLoading]         = useState(true)
  const [erro,setErro]               = useState(null)
  const [mostrarForm,setMostrarForm] = useState(false)
  const [salvando,setSalvando]       = useState(false)
  const [form,setForm]               = useState(FORM_INICIAL)
  const [editandoId,setEditandoId]   = useState(null)
  const [expandido,setExpandido]     = useState(null)

  const carregar = () => {
    setLoading(true)
    api.get('/medicos').then(r=>setMedicos(r.data||[])).catch(()=>setErro('Erro ao carregar.')).finally(()=>setLoading(false))
  }
  useEffect(()=>{carregar()},[]) 

  const handleChange = e => setForm(prev=>({...prev,[e.target.name]:e.target.value}))

  const abrirEdicao = m => {
    setForm({ nome:m.nome||'',crm:m.crm||'',especialidade:m.especialidade||'',
      telefone:m.telefone||'',email:m.email||'',
      agenda:m.agenda||{seg:[],ter:[],qua:[],qui:[],sex:[],sab:[],dom:[]}
    })
    setEditandoId(m.id); setMostrarForm(true); window.scrollTo({top:0,behavior:'smooth'})
  }

  const cancelar = () => { setMostrarForm(false); setForm(FORM_INICIAL); setEditandoId(null) }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome||!form.crm) return alert('Nome e CRM são obrigatórios!')
    setSalvando(true)
    try {
      if (editandoId) await api.patch(`/medicos/${editandoId}`, form)
      else            await api.post('/medicos', form)
      cancelar(); carregar()
    } catch (err) { alert('Erro: '+(err.response?.data?.error||err.message)) }
    finally { setSalvando(false) }
  }

  const excluir = async m => {
    if (!confirm(`Excluir o médico "${m.nome}"?\n\nSo pode excluir se não tiver consultas vinculadas.`)) return
    try { await api.delete(`/medicos/${m.id}`); carregar() }
    catch (err) { alert(`❌ ${err.response?.data?.error||err.message}`) }
  }

  const toggleAtivo = async (id,ativo) => {
    try { await api.patch(`/medicos/${id}`,{ativo:!ativo}); carregar() }
    catch (err) { alert('Erro: '+(err.response?.data?.error||err.message)) }
  }

  const totalH = m => m.agenda ? Object.values(m.agenda).reduce((a,v)=>a+(Array.isArray(v)?v.length:0),0) : 0

  return (
    <PageLayout title='👨‍⚕️ Médicos'>
      <div className='inner-toolbar'>
        <button className={`btn ${mostrarForm?'btn-secondary':'btn-primary'}`} onClick={()=>{if(mostrarForm)cancelar();else setMostrarForm(true)}}>
          {mostrarForm?'✖ Cancelar':'+ Novo Médico'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>{editandoId?'✏️ Editar Médico':'Cadastrar Novo Médico'}</h3>
          <form onSubmit={handleSubmit}>
            <div className='inner-form' style={{marginBottom:'16px'}}>
              <div className='form-field'><label className='form-label'>Nome <span className='required'>*</span></label>
                <input className='form-input' name='nome' value={form.nome} onChange={handleChange} placeholder='Dr. Nome Sobrenome' required /></div>
              <div className='form-field'><label className='form-label'>CRM <span className='required'>*</span></label>
                <input className='form-input' name='crm' value={form.crm} onChange={handleChange} placeholder='CRM/UF 000000' required /></div>
              <div className='form-field'><label className='form-label'>Especialidade</label>
                <select className='form-select' name='especialidade' value={form.especialidade} onChange={handleChange}>
                  <option value=''>-- Selecione --</option>
                  {ESPECIALIDADES.map(e=><option key={e} value={e}>{e}</option>)}
                </select></div>
              <div className='form-field'><label className='form-label'>Telefone</label>
                <input className='form-input' name='telefone' value={form.telefone} onChange={handleChange} placeholder='(00) 00000-0000' /></div>
              <div className='form-field form-field--full'><label className='form-label'>Email</label>
                <input className='form-input' type='email' name='email' value={form.email} onChange={handleChange} placeholder='medico@clinica.com' /></div>
            </div>
            <div style={{marginBottom:'16px'}}>
              <div className='form-section-divider'><span>📅 Agenda de Atendimento</span></div>
              <p style={{color:'#64748b',fontSize:'0.78rem',margin:'8px 0 12px'}}>Selecione os horários disponíveis para cada dia.</p>
              <AgendaEditor agenda={form.agenda} onChange={agenda=>setForm(prev=>({...prev,agenda}))} />
            </div>
            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>{salvando?'Salvando...':editandoId?'✓ Salvar Alterações':'✓ Salvar Médico'}</button>
              <button type='button' className='btn btn-secondary' onClick={cancelar}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {erro    && <p className='page-erro'>{erro}</p>}

      {!loading && !erro && (
        medicos.length===0
          ? (<div className='page-vazio-box'><span className='page-vazio-icon'>👨‍⚕️</span><p>Nenhum médico cadastrado.</p><button className='btn btn-primary' onClick={()=>setMostrarForm(true)}>+ Cadastrar primeiro médico</button></div>)
          : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {medicos.map(m=>(
                <div key={m.id} style={{background:'#1e293b',border:'1px solid #334155',borderRadius:'10px',overflow:'hidden'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',cursor:'pointer',flex:1}} onClick={()=>setExpandido(expandido===m.id?null:m.id)}>
                      <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'#1e3a5f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem'}}>👨‍⚕️</div>
                      <div>
                        <div style={{fontWeight:700,color:'#f1f5f9'}}>{m.nome}</div>
                        <div style={{fontSize:'0.75rem',color:'#64748b'}}>{m.crm}{m.especialidade?` • ${m.especialidade}`:''} • {totalH(m)} horários</div>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <span className={`badge badge-${m.ativo!==false?'ativo':'inativo'}`}>{m.ativo!==false?'Ativo':'Inativo'}</span>
                      <button className='btn btn-primary'  style={{fontSize:'0.7rem',padding:'4px 9px'}} onClick={()=>abrirEdicao(m)}>✏️ Editar</button>
                      <button className={`btn btn-${m.ativo!==false?'warning':'success'}`} style={{fontSize:'0.7rem',padding:'4px 9px'}} onClick={()=>toggleAtivo(m.id,m.ativo!==false)}>{m.ativo!==false?'⏸ Desativar':'▶ Ativar'}</button>
                      <button className='btn btn-danger'   style={{fontSize:'0.7rem',padding:'4px 9px'}} onClick={()=>excluir(m)}>🗑️ Excluir</button>
                      <span style={{color:'#475569',cursor:'pointer'}} onClick={()=>setExpandido(expandido===m.id?null:m.id)}>{expandido===m.id?'▲':'▼'}</span>
                    </div>
                  </div>
                  {expandido===m.id && (
                    <div style={{borderTop:'1px solid #334155',padding:'14px 18px'}}>
                      <h4 style={{color:'#38bdf8',fontSize:'0.8rem',textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 12px'}}>📅 Agenda Semanal</h4>
                      {DIAS.map(({key,label})=>{
                        const horas=m.agenda?.[key]||[]
                        return <div key={key} style={{display:'flex',gap:'10px',alignItems:'flex-start',marginBottom:'6px'}}>
                          <span style={{minWidth:'65px',color:'#94a3b8',fontSize:'0.78rem',paddingTop:'3px'}}>{label}</span>
                          {horas.length===0
                            ? <span style={{color:'#334155',fontSize:'0.76rem'}}>Não atende</span>
                            : <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                                {horas.map(h=><span key={h} style={{background:'#1e3a5f',color:'#93c5fd',fontSize:'0.7rem',padding:'2px 7px',borderRadius:'4px'}}>{h}</span>)}
                              </div>
                          }
                        </div>
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
      )}
    </PageLayout>
  )
}
