import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import './InnerPage.css'

const FORM_INICIAL = {
  paciente_id: '', medico_id: '', data_consulta: '', horario: '', motivo: '', observacoes: ''
}

export default function Consultas() {
  const [consultas, setConsultas]     = useState([])
  const [pacientes, setPacientes]     = useState([])
  const [medicos, setMedicos]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [form, setForm]               = useState(FORM_INICIAL)

  const carregarDados = () => {
    setLoading(true)
    Promise.all([
      api.get('/consultas'),
      api.get('/pacientes'),
      api.get('/medicos')
    ])
      .then(([resC, resP, resM]) => {
        setConsultas(resC.data || [])
        setPacientes(resP.data || [])
        setMedicos((resM.data || []).filter(m => m.ativo !== false))
      })
      .catch(() => setErro('Erro ao carregar dados.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregarDados() }, [])

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.paciente_id || !form.data_consulta || !form.horario || !form.motivo) {
      return alert('Paciente, data, horário e motivo são obrigatórios!')
    }
    setSalvando(true)
    try {
      await api.post('/consultas', form)
      setForm(FORM_INICIAL)
      setMostrarForm(false)
      carregarDados()
    } catch (err) {
      alert('Erro ao cadastrar: ' + (err.response?.data?.error || err.message))
    } finally { setSalvando(false) }
  }

  const getNome = (lista, id) => lista.find(x => x.id === id)?.nome || '—'

  const formatarData = d => {
    if (!d) return '—'
    const [a, m, dia] = d.split('-')
    return `${dia}/${m}/${a}`
  }

  return (
    <PageLayout title='📅 Consultas'>

      <div className='inner-toolbar'>
        <button
          className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? '✖ Cancelar' : '+ Nova Consulta'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>Agendar Nova Consulta</h3>
          <form onSubmit={handleSubmit} className='inner-form'>

            <div className='form-field form-field--full'>
              <label className='form-label'>Paciente <span className='required'>*</span></label>
              <select className='form-select' name='paciente_id'
                value={form.paciente_id} onChange={handleChange} required>
                <option value=''>Selecione um paciente</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <div className='form-field form-field--full'>
              <label className='form-label'>Médico Responsável</label>
              <select className='form-select' name='medico_id'
                value={form.medico_id} onChange={handleChange}>
                <option value=''>-- Selecione um médico --</option>
                {medicos.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nome}{m.especialidade ? ` — ${m.especialidade}` : ''}
                  </option>
                ))}
              </select>
              {medicos.length === 0 && (
                <span style={{fontSize:'0.78rem',color:'#f59e0b',marginTop:'4px'}}>
                  ⚠️ Nenhum médico cadastrado. <a href='/medicos' style={{color:'#38bdf8'}}>Cadastrar médico →</a>
                </span>
              )}
            </div>

            <div className='form-field'>
              <label className='form-label'>Data <span className='required'>*</span></label>
              <input className='form-input' type='date' name='data_consulta'
                value={form.data_consulta} onChange={handleChange} required />
            </div>

            <div className='form-field'>
              <label className='form-label'>Horário <span className='required'>*</span></label>
              <input className='form-input' type='time' name='horario'
                value={form.horario} onChange={handleChange} required />
            </div>

            <div className='form-field form-field--full'>
              <label className='form-label'>Motivo <span className='required'>*</span></label>
              <input className='form-input' type='text' name='motivo'
                value={form.motivo} onChange={handleChange}
                placeholder='Ex: Consulta de rotina, dor no joelho...' required />
            </div>

            <div className='form-field form-field--full'>
              <label className='form-label'>Observações</label>
              <textarea className='form-textarea' name='observacoes' rows={3}
                value={form.observacoes} onChange={handleChange}
                placeholder='Anotações adicionais...' />
            </div>

            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando...' : '✓ Salvar Consulta'}
              </button>
              <button type='button' className='btn btn-secondary'
                onClick={() => { setMostrarForm(false); setForm(FORM_INICIAL) }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {erro    && <p className='page-erro'>{erro}</p>}

      {!loading && !erro && (
        consultas.length === 0
          ? (
            <div className='page-vazio-box'>
              <span className='page-vazio-icon'>📅</span>
              <p>Nenhuma consulta agendada ainda.</p>
              <button className='btn btn-primary' onClick={() => setMostrarForm(true)}>+ Agendar primeira consulta</button>
            </div>
          )
          : (
            <div className='table-wrapper'>
              <table className='data-table'>
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Médico</th>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Motivo</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {consultas.map(c => (
                    <tr key={c.id}>
                      <td style={{fontWeight:600}}>{getNome(pacientes, c.paciente_id)}</td>
                      <td style={{color:'#94a3b8'}}>
                        {c.medico_id ? getNome(medicos, c.medico_id) : <span style={{color:'#475569'}}>Não informado</span>}
                      </td>
                      <td>{formatarData(c.data_consulta)}</td>
                      <td>{c.horario || '—'}</td>
                      <td>{c.motivo}</td>
                      <td style={{color:'#64748b',fontSize:'0.85rem'}}>{c.observacoes || '—'}</td>
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
