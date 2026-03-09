import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import PageLayout from '../components/PageLayout'

const DIAS_SEMANA = ['dom','seg','ter','qua','qui','sex','sab']

function AgendaDia({ medicos, consultas, pacientes, dataSelecionada }) {
  const diaSemana   = DIAS_SEMANA[new Date(dataSelecionada + 'T12:00:00').getDay()]
  const consultasDia = consultas.filter(c => c.data_consulta === dataSelecionada)

  // Agrupa consultas por médico (inclusive sem médico)
  const medicosAtivos = medicos.filter(m => m.ativo !== false)

  // IDs de médicos que têm consulta neste dia
  const medicosComConsulta = [...new Set(consultasDia.filter(c => c.medico_id).map(c => c.medico_id))]

  // Médicos que têm agenda neste dia da semana
  const medicosComAgenda = medicosAtivos
    .filter(m => m.agenda?.[diaSemana]?.length > 0)
    .map(m => m.id)

  // União: médicos com agenda OU com consulta no dia
  const medicosParaMostrar = medicosAtivos.filter(m =>
    medicosComAgenda.includes(m.id) || medicosComConsulta.includes(m.id)
  )

  // Consultas sem médico
  const semMedico = consultasDia.filter(c => !c.medico_id)

  if (medicosParaMostrar.length === 0 && semMedico.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'32px 0', color:'#475569' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'10px' }}>📅</div>
        <p style={{ margin:0 }}>Nenhuma consulta agendada para este dia.</p>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

      {/* Bloco por médico */}
      {medicosParaMostrar.map(medico => {
        const horariosAgenda  = medico.agenda?.[diaSemana] || []
        const consultasMedico = consultasDia.filter(c => c.medico_id === medico.id)

        // Horaários extras: consultas com horário que não estão na agenda configurada
        const horariosExtras = consultasMedico
          .map(c => c.horario)
          .filter(h => h && !horariosAgenda.includes(h))

        const todosHorarios = [...new Set([...horariosAgenda, ...horariosExtras])].sort()

        // Consultas sem horário definido
        const semHorario = consultasMedico.filter(c => !c.horario)

        return (
          <div key={medico.id} style={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:'10px', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ background:'#1e3a5f', padding:'12px 18px', display:'flex', alignItems:'center', gap:'12px' }}>
              <span style={{ fontSize:'1.3rem' }}>👨‍⚕️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'#f1f5f9' }}>{medico.nome}</div>
                <div style={{ fontSize:'0.75rem', color:'#93c5fd' }}>
                  {medico.especialidade || 'Clínico'}
                  {horariosAgenda.length > 0 && <span style={{marginLeft:'8px', color:'#64748b'}}>• {horariosAgenda.length} horários na agenda</span>}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'1.4rem', fontWeight:700, color: consultasMedico.length > 0 ? '#4ade80' : '#475569' }}>
                  {consultasMedico.length}
                </div>
                <div style={{ fontSize:'0.68rem', color:'#64748b' }}>agendado{consultasMedico.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {/* Grade de horários */}
            {todosHorarios.length > 0 && (
              <div style={{ padding:'12px 18px', display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {todosHorarios.map(hora => {
                  const consulta = consultasMedico.find(c => c.horario === hora)
                  const ocupado  = !!consulta
                  const extra    = ocupado && !horariosAgenda.includes(hora)
                  const paciente = ocupado ? (pacientes.find(p => p.id === consulta.paciente_id)?.nome || 'Paciente') : null

                  return (
                    <div key={hora} title={ocupado ? `${paciente} • ${consulta.motivo}` : 'Livre'} style={{
                      minWidth:'100px', padding:'8px 12px', borderRadius:'8px', border:'1px solid', cursor: ocupado ? 'default' : 'default',
                      background:  ocupado ? '#14532d' : '#1e293b',
                      borderColor: ocupado ? (extra ? '#854d0e' : '#166534') : '#334155',
                    }}>
                      <div style={{ fontWeight:700, fontSize:'0.84rem', color: ocupado ? '#4ade80' : '#475569' }}>{hora}</div>
                      {ocupado
                        ? <>
                            <div style={{ fontSize:'0.7rem', color:'#86efac', marginTop:'2px', maxWidth:'90px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{paciente}</div>
                            {extra && <div style={{ fontSize:'0.62rem', color:'#fbbf24', marginTop:'1px' }}>fora da agenda</div>}
                          </>
                        : <div style={{ fontSize:'0.68rem', color:'#334155', marginTop:'2px' }}>Livre</div>
                      }
                    </div>
                  )
                })}
              </div>
            )}

            {/* Consultas sem horário */}
            {semHorario.length > 0 && (
              <div style={{ padding:'8px 18px 14px', borderTop: todosHorarios.length > 0 ? '1px solid #1e293b' : 'none' }}>
                <div style={{ fontSize:'0.72rem', color:'#64748b', marginBottom:'6px', textTransform:'uppercase' }}>Sem horário definido</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {semHorario.map(c => {
                    const nomePac = pacientes.find(p=>p.id===c.paciente_id)?.nome || 'Paciente'
                    return (
                      <div key={c.id} style={{ background:'#1e293b', border:'1px solid #854d0e', borderRadius:'6px', padding:'6px 12px' }}>
                        <div style={{ fontSize:'0.8rem', color:'#fbbf24', fontWeight:600 }}>{nomePac}</div>
                        <div style={{ fontSize:'0.68rem', color:'#64748b' }}>{c.motivo}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Consultas sem médico */}
      {semMedico.length > 0 && (
        <div style={{ background:'#0f172a', border:'1px solid #334155', borderRadius:'10px', overflow:'hidden' }}>
          <div style={{ background:'#292524', padding:'10px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, color:'#f1f5f9' }}>📄 Sem médico vinculado</span>
            <span style={{ color:'#f59e0b', fontSize:'0.82rem' }}>{semMedico.length} consulta{semMedico.length!==1?'s':''}</span>
          </div>
          <div style={{ padding:'12px 18px', display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {semMedico.map(c => {
              const nomePac = pacientes.find(p=>p.id===c.paciente_id)?.nome||'Paciente'
              return (
                <div key={c.id} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', padding:'8px 14px', minWidth:'120px' }}>
                  <div style={{ fontWeight:600, fontSize:'0.82rem', color:'#f1f5f9' }}>{c.horario || '—'}</div>
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:'2px' }}>{nomePac}</div>
                  <div style={{ fontSize:'0.65rem', color:'#64748b', marginTop:'1px' }}>{c.motivo}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const [medicos,   setMedicos]   = useState([])
  const [consultas, setConsultas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading,   setLoading]   = useState(true)

  const hoje = new Date().toISOString().split('T')[0]
  const [dataSelecionada, setDataSelecionada] = useState(hoje)

  const labelData = new Date(dataSelecionada + 'T12:00:00')
    .toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })

  const isHoje = dataSelecionada === hoje

  useEffect(() => {
    Promise.all([api.get('/medicos'), api.get('/consultas'), api.get('/pacientes')])
      .then(([m,c,p]) => { setMedicos(m.data||[]); setConsultas(c.data||[]); setPacientes(p.data||[]) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const consultasHoje  = consultas.filter(c => c.data_consulta === hoje).length
  const consultasDia   = consultas.filter(c => c.data_consulta === dataSelecionada).length
  const totalPacientes = pacientes.length
  const totalMedicos   = medicos.filter(m => m.ativo !== false).length

  const mudarDia = (delta) => {
    const d = new Date(dataSelecionada + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setDataSelecionada(d.toISOString().split('T')[0])
  }

  return (
    <PageLayout title='🏠 Início'>

      {/* Cards de resumo */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'14px', marginBottom:'28px' }}>
        {[
          { icon:'👥', label:'Pacientes',      value:totalPacientes, color:'#38bdf8', path:'/pacientes'   },
          { icon:'👨‍⚕️', label:'Médicos',       value:totalMedicos,   color:'#a78bfa', path:'/medicos'     },
          { icon:'📅', label:'Consultas Hoje', value:consultasHoje,  color:'#22c55e', path:'/consultas'   },
          { icon:'📋', label:'Prontuários',    value:'→',            color:'#f59e0b', path:'/prontuarios' },
        ].map(card => (
          <div key={card.path} onClick={() => navigate(card.path)}
            style={{ background:'#1e293b', border:'1px solid #334155', borderTop:`3px solid ${card.color}`,
              borderRadius:'10px', padding:'18px 16px', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background='#273548'}
            onMouseLeave={e => e.currentTarget.style.background='#1e293b'}>
            <div style={{ fontSize:'1.8rem', marginBottom:'8px' }}>{card.icon}</div>
            <div style={{ fontSize:'1.6rem', fontWeight:700, color:card.color }}>{card.value}</div>
            <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:'4px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Agenda */}
      <div className='inner-card'>
        {/* Header da agenda */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px', flexWrap:'wrap', gap:'12px' }}>
          <h3 className='inner-card-title' style={{ margin:0 }}>📅 Agenda</h3>

          {/* Seletor de data */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <button onClick={() => mudarDia(-1)}
              style={{ background:'#1e293b', border:'1px solid #334155', color:'#94a3b8', borderRadius:'6px',
                padding:'5px 12px', cursor:'pointer', fontSize:'1rem', lineHeight:1 }}>
              ◄
            </button>

            <div style={{ position:'relative' }}>
              <input
                type='date'
                value={dataSelecionada}
                onChange={e => setDataSelecionada(e.target.value)}
                style={{ background:'#1e293b', border:'1px solid #334155', color:'#f1f5f9',
                  borderRadius:'6px', padding:'5px 10px', fontSize:'0.85rem', cursor:'pointer',
                  colorScheme:'dark' }}
              />
            </div>

            <button onClick={() => mudarDia(1)}
              style={{ background:'#1e293b', border:'1px solid #334155', color:'#94a3b8', borderRadius:'6px',
                padding:'5px 12px', cursor:'pointer', fontSize:'1rem', lineHeight:1 }}>
              ►
            </button>

            {!isHoje && (
              <button onClick={() => setDataSelecionada(hoje)}
                style={{ background:'#1e3a5f', border:'1px solid #1d4ed8', color:'#93c5fd',
                  borderRadius:'6px', padding:'5px 12px', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                Hoje
              </button>
            )}
          </div>
        </div>

        {/* Label do dia */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', paddingBottom:'14px', borderBottom:'1px solid #1e293b' }}>
          <span style={{ color:'#f1f5f9', fontWeight:600, textTransform:'capitalize', fontSize:'0.92rem' }}>{labelData}</span>
          <span style={{ background: consultasDia > 0 ? '#14532d' : '#1e293b',
            color: consultasDia > 0 ? '#4ade80' : '#475569',
            border: `1px solid ${consultasDia > 0 ? '#166534' : '#334155'}`,
            borderRadius:'999px', padding:'2px 10px', fontSize:'0.75rem', fontWeight:600 }}>
            {consultasDia} consulta{consultasDia !== 1 ? 's' : ''}
          </span>
          {isHoje && <span style={{ background:'#1e3a5f', color:'#93c5fd', border:'1px solid #1d4ed8', borderRadius:'999px', padding:'2px 10px', fontSize:'0.72rem' }}>Hoje</span>}
        </div>

        {loading
          ? <p className='page-loading'>Carregando agenda...</p>
          : <AgendaDia medicos={medicos} consultas={consultas} pacientes={pacientes} dataSelecionada={dataSelecionada} />
        }
      </div>
    </PageLayout>
  )
}
