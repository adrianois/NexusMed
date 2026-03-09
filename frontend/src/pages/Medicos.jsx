import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import './InnerPage.css'

const ESPECIALIDADES = [
  'Clínico Geral','Cardiologia','Dermatologia','Endocrinologia',
  'Gastroenterologia','Ginecologia','Neurologia','Oftalmologia',
  'Ortopedia','Otorrinolaringologia','Pediatria','Psiquiatria','Urologia','Outras'
]

const DIAS = [
  { key:'seg', label:'Segunda' },
  { key:'ter', label:'Terça' },
  { key:'qua', label:'Quarta' },
  { key:'qui', label:'Quinta' },
  { key:'sex', label:'Sexta' },
  { key:'sab', label:'Sábado' },
  { key:'dom', label:'Domingo' },
]

const FORM_INICIAL = {
  nome:'', crm:'', especialidade:'', telefone:'', email:'',
  agenda: { seg:[], ter:[], qua:[], qui:[], sex:[], sab:[], dom:[] }
}

function gerarHorarios(inicio, fim, intervalo) {
  const lista = []
  let [h, m] = inicio.split(':').map(Number)
  const [hf, mf] = fim.split(':').map(Number)
  while (h * 60 + m <= hf * 60 + mf) {
    lista.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    m += intervalo
    if (m >= 60) { h += Math.floor(m/60); m = m % 60 }
  }
  return lista
}

const TODOS_HORARIOS = gerarHorarios('07:00','20:00',30)

function AgendaEditor({ agenda, onChange }) {
  const toggleHorario = (dia, hora) => {
    const atual = agenda[dia] || []
    const novo = atual.includes(hora) ? atual.filter(h => h !== hora) : [...atual, hora].sort()
    onChange({ ...agenda, [dia]: novo })
  }

  const copiarPara = (diaOrigem, diasDestino) => {
    const novaAgenda = { ...agenda }
    diasDestino.forEach(d => { novaAgenda[d] = [...(agenda[diaOrigem] || [])] })
    onChange(novaAgenda)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      {DIAS.map(({ key, label }) => (
        <div key={key} style={{ background:'#0f172a', borderRadius:'8px', padding:'12px 14px', border:'1px solid #1e293b' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
            <span style={{ color:'#38bdf8', fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase' }}>
              {label}
              <span style={{ color:'#475569', fontWeight:400, marginLeft:'8px' }}>
                ({(agenda[key]||[]).length} horários)
              </span>
            </span>
            <div style={{ display:'flex', gap:'6px' }}>
              <button type='button' onClick={() => onChange({ ...agenda, [key]: [] })}
                style={{ fontSize:'0.7rem', padding:'2px 8px', background:'#450a0a', color:'#f87171', border:'1px solid #7f1d1d', borderRadius:'4px', cursor:'pointer' }}>
                Limpar
              </button>
              <button type='button'
                onClick={() => copiarPara(key, DIAS.map(d=>d.key).filter(k=>k!==key && !['sab','dom'].includes(k)))}
                style={{ fontSize:'0.7rem', padding:'2px 8px', background:'#1e3a5f', color:'#38bdf8', border:'1px solid #1d4ed8', borderRadius:'4px', cursor:'pointer' }}>
                Copiar → dias úteis
              </button>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {TODOS_HORARIOS.map(hora => {
              const sel = (agenda[key]||[]).includes(hora)
              return (
                <button key={hora} type='button' onClick={() => toggleHorario(key, hora)}
                  style={{
                    padding:'4px 10px', fontSize:'0.75rem', borderRadius:'5px', cursor:'pointer', border:'1px solid',
                    background: sel ? '#1e40af' : '#1e293b',
                    color:      sel ? '#93c5fd' : '#64748b',
                    borderColor:sel ? '#3b82f6' : '#334155',
                    fontWeight: sel ? 700 : 400
                  }}>
                  {hora}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Medicos() {
  const [medicos, setMedicos]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [erro, setErro]                 = useState(null)
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [salvando, setSalvando]         = useState(false)
  const [form, setForm]                 = useState(FORM_INICIAL)
  const [expandido, setExpandido]       = useState(null)

  const carregar = () => {
    setLoading(true)
    api.get('/medicos').then(r => setMedicos(r.data||[])).catch(()=>setErro('Erro ao carregar.')).finally(()=>setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome || !form.crm) return alert('Nome e CRM são obrigatórios!')
    setSalvando(true)
    try {
      await api.post('/medicos', form)
      setForm(FORM_INICIAL)
      setMostrarForm(false)
      carregar()
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message))
    } finally { setSalvando(false) }
  }

  const toggleAtivo = async (id, ativo) => {
    try { await api.patch(`/medicos/${id}`, { ativo: !ativo }); carregar() }
    catch (err) { alert('Erro: ' + (err.response?.data?.error || err.message)) }
  }

  const totalHorarios = (m) => {
    if (!m.agenda) return 0
    return Object.values(m.agenda).reduce((acc, v) => acc + (Array.isArray(v) ? v.length : 0), 0)
  }

  return (
    <PageLayout title='👨‍⚕️ Médicos'>
      <div className='inner-toolbar'>
        <button className={`btn ${mostrarForm?'btn-secondary':'btn-primary'}`} onClick={()=>setMostrarForm(!mostrarForm)}>
          {mostrarForm ? '✖ Cancelar' : '+ Novo Médico'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>Cadastrar Novo Médico</h3>
          <form onSubmit={handleSubmit}>
            <div className='inner-form' style={{ marginBottom:'20px' }}>
              <div className='form-field'>
                <label className='form-label'>Nome <span className='required'>*</span></label>
                <input className='form-input' name='nome' value={form.nome} onChange={handleChange} placeholder='Dr. Nome Sobrenome' required />
              </div>
              <div className='form-field'>
                <label className='form-label'>CRM <span className='required'>*</span></label>
                <input className='form-input' name='crm' value={form.crm} onChange={handleChange} placeholder='CRM/UF 000000' required />
              </div>
              <div className='form-field'>
                <label className='form-label'>Especialidade</label>
                <select className='form-select' name='especialidade' value={form.especialidade} onChange={handleChange}>
                  <option value=''>-- Selecione --</option>
                  {ESPECIALIDADES.map(e=><option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className='form-field'>
                <label className='form-label'>Telefone</label>
                <input className='form-input' name='telefone' value={form.telefone} onChange={handleChange} placeholder='(00) 00000-0000' />
              </div>
              <div className='form-field form-field--full'>
                <label className='form-label'>Email</label>
                <input className='form-input' type='email' name='email' value={form.email} onChange={handleChange} placeholder='medico@clinica.com' />
              </div>
            </div>

            <div style={{ marginBottom:'20px' }}>
              <div className='form-section-divider'><span>📅 Agenda de Atendimento</span></div>
              <p style={{ color:'#64748b', fontSize:'0.8rem', margin:'10px 0 14px' }}>
                Selecione os horários disponíveis para agendamento em cada dia da semana.
              </p>
              <AgendaEditor agenda={form.agenda} onChange={agenda => setForm(prev=>({...prev, agenda}))} />
            </div>

            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando...' : '✓ Salvar Médico'}
              </button>
              <button type='button' className='btn btn-secondary' onClick={()=>{setMostrarForm(false);setForm(FORM_INICIAL)}}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {erro    && <p className='page-erro'>{erro}</p>}

      {!loading && !erro && (
        medicos.length === 0
          ? (
            <div className='page-vazio-box'>
              <span className='page-vazio-icon'>👨‍⚕️</span>
              <p>Nenhum médico cadastrado.</p>
              <button className='btn btn-primary' onClick={()=>setMostrarForm(true)}>+ Cadastrar primeiro médico</button>
            </div>
          )
          : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {medicos.map(m => (
                <div key={m.id} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'10px', overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', cursor:'pointer' }}
                    onClick={() => setExpandido(expandido===m.id ? null : m.id)}>
                    <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>👨‍⚕️</div>
                      <div>
                        <div style={{ fontWeight:700, color:'#f1f5f9' }}>{m.nome}</div>
                        <div style={{ fontSize:'0.78rem', color:'#64748b' }}>{m.crm} {m.especialidade ? `• ${m.especialidade}` : ''}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontSize:'0.75rem', color:'#64748b' }}>{totalHorarios(m)} horários</span>
                      <span className={`badge badge-${m.ativo!==false?'ativo':'inativo'}`}>{m.ativo!==false?'Ativo':'Inativo'}</span>
                      <button className={`btn btn-${m.ativo!==false?'warning':'success'}`} style={{ fontSize:'0.72rem', padding:'4px 10px' }}
                        onClick={e => { e.stopPropagation(); toggleAtivo(m.id, m.ativo!==false) }}>
                        {m.ativo!==false?'⏸ Desativar':'▶ Ativar'}
                      </button>
                      <span style={{ color:'#475569', fontSize:'1rem' }}>{expandido===m.id?'▲':'▼'}</span>
                    </div>
                  </div>

                  {expandido===m.id && (
                    <div style={{ borderTop:'1px solid #334155', padding:'16px 20px' }}>
                      <h4 style={{ color:'#38bdf8', fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 14px' }}>📅 Agenda Semanal</h4>
                      {DIAS.map(({ key, label }) => {
                        const horas = m.agenda?.[key] || []
                        return (
                          <div key={key} style={{ display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'8px' }}>
                            <span style={{ minWidth:'70px', color:'#94a3b8', fontSize:'0.8rem', paddingTop:'4px' }}>{label}</span>
                            {horas.length === 0
                              ? <span style={{ color:'#334155', fontSize:'0.78rem' }}>Não atende</span>
                              : <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                                  {horas.map(h => (
                                    <span key={h} style={{ background:'#1e3a5f', color:'#93c5fd', fontSize:'0.72rem', padding:'2px 8px', borderRadius:'4px' }}>{h}</span>
                                  ))}
                                </div>
                            }
                          </div>
                        )
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
