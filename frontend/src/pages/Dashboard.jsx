import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import PageLayout from '../components/PageLayout'

const DIAS_SEMANA = ['dom','seg','ter','qua','qui','sex','sab']

function AgendaHoje({ medicos, consultas, pacientes, hoje }) {
  const consultasHoje = consultas.filter(c => c.data_consulta === hoje)

  if (medicos.filter(m=>m.ativo!==false).length === 0) {
    return <div style={{color:'#475569',fontSize:'0.88rem',padding:'20px 0'}}>Nenhum médico cadastrado ainda.</div>
  }

  const diaSemana = DIAS_SEMANA[new Date(hoje + 'T12:00:00').getDay()]

  const medicosHoje = medicos
    .filter(m => m.ativo!==false && m.agenda?.[diaSemana]?.length > 0)

  if (medicosHoje.length === 0) {
    return <div style={{color:'#475569',fontSize:'0.88rem',padding:'20px 0'}}>Nenhum médico atende hoje ({diaSemana}).</div>
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      {medicosHoje.map(medico => {
        const horariosAgenda = medico.agenda[diaSemana] || []
        const consultasMedico = consultasHoje.filter(c => c.medico_id === medico.id)

        return (
          <div key={medico.id} style={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:'10px', overflow:'hidden' }}>
            {/* Header médico */}
            <div style={{ background:'#1e3a5f', padding:'12px 18px', display:'flex', alignItems:'center', gap:'12px' }}>
              <span style={{ fontSize:'1.4rem' }}>👨‍⚕️</span>
              <div>
                <div style={{ fontWeight:700, color:'#f1f5f9', fontSize:'0.95rem' }}>{medico.nome}</div>
                <div style={{ fontSize:'0.75rem', color:'#93c5fd' }}>{medico.especialidade || 'Clínico'} • {horariosAgenda.length} horários hoje</div>
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <div style={{ fontSize:'1.2rem', fontWeight:700, color:'#22c55e' }}>{consultasMedico.length}</div>
                <div style={{ fontSize:'0.7rem', color:'#64748b' }}>agendados</div>
              </div>
            </div>

            {/* Grade de horários */}
            <div style={{ padding:'14px 18px', display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {horariosAgenda.map(hora => {
                const consulta = consultasMedico.find(c => c.horario === hora)
                const ocupado = !!consulta
                const nomePaciente = ocupado ? (pacientes.find(p=>p.id===consulta.paciente_id)?.nome || 'Paciente') : null

                return (
                  <div key={hora} style={{
                    minWidth:'100px', padding:'8px 12px', borderRadius:'8px', border:'1px solid',
                    background:  ocupado ? '#14532d' : '#1e293b',
                    borderColor: ocupado ? '#166534' : '#334155',
                  }}>
                    <div style={{ fontWeight:700, fontSize:'0.85rem', color: ocupado ? '#4ade80' : '#94a3b8' }}>{hora}</div>
                    {ocupado
                      ? <div style={{ fontSize:'0.7rem', color:'#86efac', marginTop:'3px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'90px' }}>{nomePaciente}</div>
                      : <div style={{ fontSize:'0.7rem', color:'#334155', marginTop:'3px' }}>Livre</div>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const perfil   = user?.perfil

  const [medicos, setMedicos]     = useState([])
  const [consultas, setConsultas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loadAgenda, setLoadAgenda] = useState(true)

  const hoje = new Date().toISOString().split('T')[0]
  const hojeFormatado = new Date(hoje + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })

  useEffect(() => {
    Promise.all([api.get('/medicos'), api.get('/consultas'), api.get('/pacientes')])
      .then(([m,c,p]) => {
        setMedicos(m.data||[])
        setConsultas(c.data||[])
        setPacientes(p.data||[])
      })
      .catch(()=>{})
      .finally(()=>setLoadAgenda(false))
  }, [])

  const consultasHoje  = consultas.filter(c => c.data_consulta === hoje).length
  const totalPacientes = pacientes.length
  const totalMedicos   = medicos.filter(m=>m.ativo!==false).length

  return (
    <PageLayout title='🏠 Início'>
      {/* Cards de resumo */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'14px', marginBottom:'32px' }}>
        {[
          { icon:'👥', label:'Pacientes',   value:totalPacientes, color:'#38bdf8', path:'/pacientes'   },
          { icon:'👨‍⚕️', label:'Médicos',    value:totalMedicos,   color:'#a78bfa', path:'/medicos'     },
          { icon:'📅', label:'Consultas Hoje', value:consultasHoje, color:'#22c55e', path:'/consultas'   },
          { icon:'📋', label:'Prontuários', value:'→',       color:'#f59e0b', path:'/prontuarios' },
        ].map(card => (
          <div key={card.path} onClick={()=>navigate(card.path)}
            style={{ background:'#1e293b', border:`1px solid #334155`, borderTop:`3px solid ${card.color}`,
              borderRadius:'10px', padding:'18px 16px', cursor:'pointer', transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#273548'}
            onMouseLeave={e=>e.currentTarget.style.background='#1e293b'}>
            <div style={{ fontSize:'1.8rem', marginBottom:'8px' }}>{card.icon}</div>
            <div style={{ fontSize:'1.6rem', fontWeight:700, color:card.color }}>{card.value}</div>
            <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:'4px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Agenda do dia */}
      <div className='inner-card'>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
          <h3 className='inner-card-title' style={{ margin:0 }}>📅 Agenda de Hoje</h3>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'#f1f5f9', fontWeight:600, fontSize:'0.9rem', textTransform:'capitalize' }}>{hojeFormatado}</div>
            <div style={{ color:'#64748b', fontSize:'0.75rem' }}>{consultasHoje} consulta{consultasHoje!==1?'s':''} agendada{consultasHoje!==1?'s':''}</div>
          </div>
        </div>
        {loadAgenda
          ? <p className='page-loading'>Carregando agenda...</p>
          : <AgendaHoje medicos={medicos} consultas={consultas} pacientes={pacientes} hoje={hoje} />
        }
      </div>
    </PageLayout>
  )
}
