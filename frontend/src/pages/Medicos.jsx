import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import './InnerPage.css'

const ESPECIALIDADES = [
  'Clínico Geral', 'Cardiologia', 'Dermatologia', 'Endocrinologia',
  'Gastroenterologia', 'Ginecologia', 'Neurologia', 'Oftalmologia',
  'Ortopedia', 'Otorrinolaringologia', 'Pediatria', 'Psiquiatria',
  'Urologia', 'Outras'
]

const FORM_INICIAL = {
  nome: '', crm: '', especialidade: '', telefone: '', email: ''
}

export default function Medicos() {
  const [medicos, setMedicos]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [form, setForm]               = useState(FORM_INICIAL)

  const carregar = () => {
    setLoading(true)
    api.get('/medicos')
      .then(r => setMedicos(r.data || []))
      .catch(() => setErro('Erro ao carregar médicos.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

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
    try {
      await api.patch(`/medicos/${id}`, { ativo: !ativo })
      carregar()
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <PageLayout title='👨‍⚕️ Médicos'>

      <div className='inner-toolbar'>
        <button
          className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? '✖ Cancelar' : '+ Novo Médico'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>Cadastrar Novo Médico</h3>
          <form onSubmit={handleSubmit} className='inner-form'>

            <div className='form-field'>
              <label className='form-label'>Nome Completo <span className='required'>*</span></label>
              <input className='form-input' name='nome' value={form.nome}
                onChange={handleChange} placeholder='Dr. Nome Sobrenome' required />
            </div>

            <div className='form-field'>
              <label className='form-label'>CRM <span className='required'>*</span></label>
              <input className='form-input' name='crm' value={form.crm}
                onChange={handleChange} placeholder='CRM/UF 000000' required />
            </div>

            <div className='form-field'>
              <label className='form-label'>Especialidade</label>
              <select className='form-select' name='especialidade'
                value={form.especialidade} onChange={handleChange}>
                <option value=''>-- Selecione --</option>
                {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className='form-field'>
              <label className='form-label'>Telefone</label>
              <input className='form-input' name='telefone' value={form.telefone}
                onChange={handleChange} placeholder='(00) 00000-0000' />
            </div>

            <div className='form-field form-field--full'>
              <label className='form-label'>Email</label>
              <input className='form-input' type='email' name='email' value={form.email}
                onChange={handleChange} placeholder='medico@clinica.com' />
            </div>

            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando...' : '✓ Salvar Médico'}
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
        medicos.length === 0
          ? (
            <div className='page-vazio-box'>
              <span className='page-vazio-icon'>👨‍⚕️</span>
              <p>Nenhum médico cadastrado ainda.</p>
              <button className='btn btn-primary' onClick={() => setMostrarForm(true)}>
                + Cadastrar primeiro médico
              </button>
            </div>
          )
          : (
            <div className='table-wrapper'>
              <table className='data-table'>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CRM</th>
                    <th>Especialidade</th>
                    <th>Telefone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {medicos.map(m => (
                    <tr key={m.id}>
                      <td style={{fontWeight:600}}>{m.nome}</td>
                      <td style={{color:'#94a3b8'}}>{m.crm}</td>
                      <td>{m.especialidade || '—'}</td>
                      <td>{m.telefone || '—'}</td>
                      <td>{m.email || '—'}</td>
                      <td>
                        <span className={`badge badge-${m.ativo !== false ? 'ativo' : 'inativo'}`}>
                          {m.ativo !== false ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-${m.ativo !== false ? 'warning' : 'success'}`}
                          style={{fontSize:'0.78rem',padding:'5px 12px'}}
                          onClick={() => toggleAtivo(m.id, m.ativo !== false)}
                        >
                          {m.ativo !== false ? '⏸ Desativar' : '▶ Ativar'}
                        </button>
                      </td>
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
