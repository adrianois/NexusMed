import { useEffect, useState } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'

export default function AdminClinicas() {
  const [clinicas, setClinicas] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', cnpj: '', endereco: '', telefone: '' })

  const carregar = () => {
    setLoading(true)
    api.get('/admin/clinicas').then(r => setClinicas(r.data || [])).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome || !form.cnpj) return alert('Nome e CNPJ são obrigatórios!')
    setSalvando(true)
    try {
      await api.post('/admin/clinicas', form)
      setForm({ nome: '', cnpj: '', endereco: '', telefone: '' })
      setMostrarForm(false)
      carregar()
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message))
    } finally { setSalvando(false) }
  }

  const toggleStatus = async (id, ativo) => {
    if (!confirm(`${ativo ? 'Desativar' : 'Ativar'} esta clínica?`)) return
    try {
      await api.patch(`/admin/clinicas/${id}/status`, { ativo: !ativo })
      carregar()
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <PageLayout title='🏨 Gerenciar Clínicas'>
      <div className='inner-toolbar'>
        <button className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? '✖ Cancelar' : '+ Nova Clínica'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>Cadastrar Nova Clínica</h3>
          <form onSubmit={handleSubmit} className='inner-form'>
            <div className='form-field form-field--full'>
              <label className='form-label'>Nome da Clínica <span className='required'>*</span></label>
              <input className='form-input' name='nome' value={form.nome} onChange={handleChange} placeholder='Ex: Clínica Santa Maria' required />
            </div>
            <div className='form-field'>
              <label className='form-label'>CNPJ <span className='required'>*</span></label>
              <input className='form-input' name='cnpj' value={form.cnpj} onChange={handleChange} placeholder='00.000.000/0000-00' required />
            </div>
            <div className='form-field'>
              <label className='form-label'>Telefone</label>
              <input className='form-input' name='telefone' value={form.telefone} onChange={handleChange} placeholder='(00) 00000-0000' />
            </div>
            <div className='form-field form-field--full'>
              <label className='form-label'>Endereço</label>
              <input className='form-input' name='endereco' value={form.endereco} onChange={handleChange} placeholder='Rua, número, bairro, cidade' />
            </div>
            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>{salvando ? 'Salvando...' : '✓ Salvar Clínica'}</button>
              <button type='button' className='btn btn-secondary' onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {!loading && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead><tr><th>Nome</th><th>CNPJ</th><th>Endereço</th><th>Telefone</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              {clinicas.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#64748b',padding:'2rem'}}>Nenhuma clínica cadastrada.</td></tr>}
              {clinicas.map(c => (
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.nome}</td>
                  <td>{c.cnpj}</td>
                  <td>{c.endereco || '-'}</td>
                  <td>{c.telefone || '-'}</td>
                  <td><span className={`badge badge-${c.ativo ? 'ativo' : 'inativo'}`}>{c.ativo ? 'Ativa' : 'Inativa'}</span></td>
                  <td>
                    <button className={`btn btn-${c.ativo ? 'warning' : 'success'}`} style={{fontSize:'0.78rem',padding:'5px 12px'}} onClick={() => toggleStatus(c.id, c.ativo)}>
                      {c.ativo ? '⏸ Desativar' : '▶ Ativar'}
                    </button>
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
