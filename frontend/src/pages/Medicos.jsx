import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { useConfirm } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import './InnerPage.css'

const FORM_INICIAL = { nome: '', crm: '', especialidade: '', telefone: '', email: '' }

export default function Medicos() {
  const [medicos,     setMedicos]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [salvando,    setSalvando]    = useState(false)
  const [busca,       setBusca]       = useState('')
  const [form,        setForm]        = useState(FORM_INICIAL)
  const { confirmar, ConfirmModalUI } = useConfirm()
  const { toast, ToastUI }            = useToast()

  const carregar = () => {
    setLoading(true)
    api.get('/medicos').then(r => setMedicos(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const abrirNovo    = () => { setForm(FORM_INICIAL); setEditando(null); setMostrarForm(true) }
  const abrirEditar  = m  => {
    setForm({ nome: m.nome||'', crm: m.crm||'', especialidade: m.especialidade||'', telefone: m.telefone||'', email: m.email||'' })
    setEditando(m.id); setMostrarForm(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome || !form.crm) { toast('Nome e CRM são obrigatórios!', 'error'); return }
    setSalvando(true)
    try {
      if (editando) { await api.put(`/medicos/${editando}`, form); toast('Médico atualizado!', 'success') }
      else          { await api.post('/medicos', form);             toast('Médico cadastrado!', 'success') }
      setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL); carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
    finally { setSalvando(false) }
  }

  const excluir = async (id, nome) => {
    const ok = await confirmar({
      titulo: 'Excluir Médico',
      mensagem: `Deseja excluir o médico "${nome}"? Esta ação não pode ser desfeita.`,
      labelOk: 'Excluir',
      tipo: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/medicos/${id}`)
      toast('Médico excluído.', 'success')
      carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
  }

  const filtrados = medicos.filter(m =>
    !busca || m.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    m.crm?.toLowerCase().includes(busca.toLowerCase()) ||
    m.especialidade?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <PageLayout title='👨‍⚕️ Médicos'>
      <ConfirmModalUI /><ToastUI />

      <div className='inner-toolbar'>
        <input className='form-input' style={{ maxWidth: '260px' }}
          placeholder='🔍 Buscar por nome, CRM ou especialidade...'
          value={busca} onChange={e => setBusca(e.target.value)} />
        <button className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => { if (mostrarForm) { setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL) } else abrirNovo() }}>
          {mostrarForm ? '✖ Cancelar' : '+ Novo Médico'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>{editando ? '✏️ Editar Médico' : 'Cadastrar Novo Médico'}</h3>
          <form onSubmit={handleSubmit} className='inner-form'>
            <div className='form-field form-field--full'>
              <label className='form-label'>Nome completo <span className='required'>*</span></label>
              <input className='form-input' name='nome' value={form.nome} onChange={handleChange} placeholder='Dr(a). Nome Sobrenome' required />
            </div>
            <div className='form-field'>
              <label className='form-label'>CRM <span className='required'>*</span></label>
              <input className='form-input' name='crm' value={form.crm} onChange={handleChange} placeholder='CRM/UF 000000' required />
            </div>
            <div className='form-field'>
              <label className='form-label'>Especialidade</label>
              <input className='form-input' name='especialidade' value={form.especialidade} onChange={handleChange} placeholder='Ex: Cardiologia' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Telefone</label>
              <input className='form-input' name='telefone' value={form.telefone} onChange={handleChange} placeholder='(00) 00000-0000' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Email</label>
              <input className='form-input' type='email' name='email' value={form.email} onChange={handleChange} placeholder='email@clinica.com' />
            </div>
            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando...' : editando ? '✓ Atualizar' : '✓ Cadastrar'}
              </button>
              <button type='button' className='btn btn-secondary'
                onClick={() => { setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL) }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {!loading && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead><tr><th>Nome</th><th>CRM</th><th>Especialidade</th><th>Contato</th><th>Ações</th></tr></thead>
            <tbody>
              {filtrados.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',color:'#64748b',padding:'2rem'}}>Nenhum médico encontrado.</td></tr>}
              {filtrados.map(m => (
                <tr key={m.id}>
                  <td style={{fontWeight:600}}>{m.nome}</td>
                  <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{m.crm||'—'}</td>
                  <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{m.especialidade||'—'}</td>
                  <td style={{fontSize:'0.82rem'}}>{m.telefone||m.email||'—'}</td>
                  <td>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button className='btn btn-secondary' style={{fontSize:'0.78rem',padding:'5px 10px'}} onClick={() => abrirEditar(m)}>✏️ Editar</button>
                      <button className='btn btn-danger'    style={{fontSize:'0.78rem',padding:'5px 10px'}} onClick={() => excluir(m.id, m.nome)}>🗑️ Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}
