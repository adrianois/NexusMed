import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import PageLayout from '../../components/PageLayout'

const DIAS_SEMANA = ['dom','seg','ter','qua','qui','sex','sab']

export default function GestorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pendentes, setPendentes]   = useState([])
  const [medicos, setMedicos]       = useState([])
  const [consultas, setConsultas]   = useState([])
  const [pacientes, setPacientes]   = useState([])
  const [loading, setLoading]       = useState(true)

  const hoje = new Date().toISOString().split('T')[0]
  const hojeFormatado = new Date(hoje+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})

  useEffect(() => {
    Promise.all([
      api.get('/gestor/usuarios/pendentes'),
      api.get('/medicos'),
      api.get('/consultas'),
      api.get('/pacientes')
    ]).then(([pu,m,c,p]) => {
      setPendentes(pu.data||[])
      setMedicos(m.data||[])
      setConsultas(c.data||[])
      setPacientes(p.data||[])
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const consultasHoje = consultas.filter(c=>c.data_consulta===hoje)
  const diaSemana     = DIAS_SEMANA[new Date(hoje+'T12:00:00').getDay()]
  const medicosHoje   = medicos.filter(m=>m.ativo!==false && m.agenda?.[diaSemana]?.length>0)

  return (
    <PageLayout title='📊 Painel do Gestor'>
      {/* Resumo */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'14px', marginBottom:'28px' }}>
        {[
          { icon:'⏳', label:'Pendentes', value:pendentes.length, color:'#f59e0b', path:'/gestor/usuarios' },
          { icon:'👥', label:'Pacientes', value:pacientes.length, color:'#38bdf8', path:'/pacientes' },
          { icon:'👨‍⚕️', label:'Médicos', value:medicos.filter(m=>m.ativo!==false).length, color:'#a78bfa', path:'/medicos' },
          { icon:'📅', label:'Hoje', value:consultasHoje.length, color:'#22c55e', path:'/consultas' },
        ].map(card=>(
          <div key={card.path} onClick={()=>navigate(card.path)}
            style={{ background:'#1e293b', borderTop:`3px solid ${card.color}`, border:'1px solid #334155',
              borderRadius:'10px', padding:'16px', cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.background='#273548'}
            onMouseLeave={e=>e.currentTarget.style.background='#1e293b'}>
            <div style={{ fontSize:'1.6rem', marginBottom:'6px' }}>{card.icon}</div>
            <div style={{ fontSize:'1.5rem', fontWeight:700, color:card.color }}>{card.value}</div>
            <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:'2px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Agenda do dia */}
      <div className='inner-card'>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <h3 className='inner-card-title' style={{ margin:0 }}>📅 Agenda de Hoje</h3>
          <div style={{ color:'#f1f5f9', fontSize:'0.85rem', textTransform:'capitalize' }}>{hojeFormatado}</div>
        </div>

        {loading ? <p className='page-loading'>Carregando...</p> : (
          medicosHoje.length === 0
            ? <div style={{color:'#475569',fontSize:'0.88rem'}}>Nenhum médico atende hoje.</div>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {medicosHoje.map(medico => {
                  const horariosAgenda   = medico.agenda[diaSemana] || []
                  const consultasMedico  = consultasHoje.filter(c=>c.medico_id===medico.id)
                  return (
                    <div key={medico.id} style={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:'8px', overflow:'hidden' }}>
                      <div style={{ background:'#1e3a5f', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <span style={{ fontWeight:700, color:'#f1f5f9' }}>👨‍⚕️ {medico.nome}</span>
                          <span style={{ color:'#93c5fd', fontSize:'0.75rem', marginLeft:'10px' }}>{medico.especialidade||'Clínico'}</span>
                        </div>
                        <span style={{ color:'#22c55e', fontSize:'0.82rem' }}>{consultasMedico.length}/{horariosAgenda.length} ocupados</span>
                      </div>
                      <div style={{ padding:'12px 16px', display:'flex', flexWrap:'wrap', gap:'6px' }}>
                        {horariosAgenda.map(hora => {
                          const consulta = consultasMedico.find(c=>c.horario===hora)
                          const ocupado  = !!consulta
                          const paciente = ocupado ? (pacientes.find(p=>p.id===consulta.paciente_id)?.nome||'Paciente') : null
                          return (
                            <div key={hora} style={{
                              minWidth:'90px', padding:'6px 10px', borderRadius:'6px', border:'1px solid',
                              background:  ocupado?'#14532d':'#1e293b',
                              borderColor: ocupado?'#166534':'#334155',
                            }}>
                              <div style={{ fontWeight:700, fontSize:'0.82rem', color:ocupado?'#4ade80':'#94a3b8' }}>{hora}</div>
                              <div style={{ fontSize:'0.68rem', color:ocupado?'#86efac':'#334155', marginTop:'2px', maxWidth:'80px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {ocupado ? paciente : 'Livre'}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
        )}
      </div>

      {pendentes.length>0 && (
        <div className='inner-card' style={{ marginTop:'20px' }}>
          <h3 className='inner-card-title'>⚠️ {pendentes.length} usuário{pendentes.length>1?'s':''} aguardando aprovação</h3>
          <button className='btn btn-primary' onClick={()=>navigate('/gestor/usuarios')}>Ver e Aprovar →</button>
        </div>
      )}
    </PageLayout>
  )
}
