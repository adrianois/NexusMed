import { useEffect, useState } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'

const FORM_INICIAL = {
  nome: '', cnpj: '', telefone: '', email: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: ''
}

export default function AdminClinicas() {
  const [clinicas, setClinicas]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [form, setForm]               = useState(FORM_INICIAL)

  const carregar = () => {
    setLoading(true)
    api.get('/admin/clinicas').then(r => setClinicas(r.data || [])).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleCep = async (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setForm(prev => ({ ...prev, cep: e.target.value }))
    if (raw.length === 8) {
      setBuscandoCep(true)
      try {
        const res  = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            logradouro: data.logradouro || '',
            bairro:     data.bairro     || '',
            cidade:     data.localidade || '',
            estado:     data.uf         || ''
          }))
        }
      } catch {}
      finally { setBuscandoCep(false) }
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome || !form.cnpj) return alert('Nome e CNPJ são obrigatórios!')
    setSalvando(true)
    // Monta endereço legado como string para retrocompatibilidade
    const enderecoStr = [form.logradouro, form.numero, form.bairro, form.cidade, form.estado]
      .filter(Boolean).join(', ')
    try {
      await api.post('/admin/clinicas', { ...form, endereco: enderecoStr })
      setForm(FORM_INICIAL)
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
        <button
          className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? '✖ Cancelar' : '+ Nova Clínica'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>Cadastrar Nova Clínica</h3>
          <form onSubmit={handleSubmit} className='inner-form'>

            {/* Dados da clínica */}
            <div className='form-field form-field--full'>
              <label className='form-label'>Nome da Clínica <span className='required'>*</span></label>
              <input className='form-input' name='nome' value={form.nome} onChange={handleChange}
                placeholder='Ex: Clínica Santa Maria' required />
            </div>

            <div className='form-field'>
              <label className='form-label'>CNPJ <span className='required'>*</span></label>
              <input className='form-input' name='cnpj' value={form.cnpj} onChange={handleChange}
                placeholder='00.000.000/0000-00' required />
            </div>

            <div className='form-field'>
              <label className='form-label'>Telefone</label>
              <input className='form-input' name='telefone' value={form.telefone} onChange={handleChange}
                placeholder='(00) 00000-0000' />
            </div>

            <div className='form-field form-field--full'>
              <label className='form-label'>Email da Clínica</label>
              <input className='form-input' type='email' name='email' value={form.email} onChange={handleChange}
                placeholder='contato@clinica.com.br' />
            </div>

            {/* Endereço */}
            <div className='form-field form-field--full'>
              <div className='form-section-divider'><span>📍 Endereço</span></div>
            </div>

            <div className='form-field'>
              <label className='form-label'>
                CEP {buscandoCep && <span style={{color:'#38bdf8',fontWeight:400}}>(buscando...)</span>}
              </label>
              <input className='form-input' name='cep' value={form.cep} onChange={handleCep}
                placeholder='00000-000' maxLength={9} />
            </div>

            <div className='form-field'>
              <label className='form-label'>Número</label>
              <input className='form-input' name='numero' value={form.numero} onChange={handleChange}
                placeholder='Nº' />
            </div>

            <div className='form-field form-field--full'>
              <label className='form-label'>Logradouro</label>
              <input className='form-input' name='logradouro' value={form.logradouro} onChange={handleChange}
                placeholder='Rua, Avenida...' />
            </div>

            <div className='form-field'>
              <label className='form-label'>Complemento</label>
              <input className='form-input' name='complemento' value={form.complemento} onChange={handleChange}
                placeholder='Sala, Andar...' />
            </div>

            <div className='form-field'>
              <label className='form-label'>Bairro</label>
              <input className='form-input' name='bairro' value={form.bairro} onChange={handleChange}
                placeholder='Bairro' />
            </div>

            <div className='form-field'>
              <label className='form-label'>Cidade</label>
              <input className='form-input' name='cidade' value={form.cidade} onChange={handleChange}
                placeholder='Cidade' />
            </div>

            <div className='form-field'>
              <label className='form-label'>Estado (UF)</label>
              <input className='form-input' name='estado' value={form.estado} onChange={handleChange}
                placeholder='UF' maxLength={2} style={{textTransform:'uppercase'}} />
            </div>

            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando...' : '✓ Salvar Clínica'}
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

      {!loading && (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {clinicas.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:'center',color:'#64748b',padding:'2rem'}}>Nenhuma clínica cadastrada.</td></tr>
              )}
              {clinicas.map(c => (
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.nome}</td>
                  <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{c.cnpj}</td>
                  <td>{c.telefone || '—'}</td>
                  <td style={{fontSize:'0.82rem',color:'#94a3b8',maxWidth:'220px'}}>
                    {c.endereco || '—'}
                  </td>
                  <td>
                    <span className={`badge badge-${c.ativo ? 'ativo' : 'inativo'}`}>
                      {c.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-${c.ativo ? 'warning' : 'success'}`}
                      style={{fontSize:'0.78rem',padding:'5px 12px'}}
                      onClick={() => toggleStatus(c.id, c.ativo)}
                    >
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
