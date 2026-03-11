import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import { useConfirm } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import './InnerPage.css'

const FORM_INICIAL = {
  nome: '', cpf: '', data_nascimento: '', telefone: '', email: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  plano_saude: '', numero_carteirinha: '', observacoes: ''
}

export default function Pacientes() {
  const [pacientes,    setPacientes]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [mostrarForm,  setMostrarForm]  = useState(false)
  const [editando,     setEditando]     = useState(null)
  const [salvando,     setSalvando]     = useState(false)
  const [busca,        setBusca]        = useState('')
  const [buscandoCep,  setBuscandoCep]  = useState(false)
  const [form,         setForm]         = useState(FORM_INICIAL)
  const { confirmar, ConfirmModalUI }   = useConfirm()
  const { toast, ToastUI }              = useToast()

  const carregar = () => {
    setLoading(true)
    api.get('/pacientes').then(r => setPacientes(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleCep = async (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setForm(prev => ({ ...prev, cep: e.target.value }))
    if (raw.length === 8) {
      setBuscandoCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
        const d   = await res.json()
        if (!d.erro) setForm(prev => ({ ...prev, logradouro: d.logradouro||'', bairro: d.bairro||'', cidade: d.localidade||'', estado: d.uf||'' }))
      } catch {} finally { setBuscandoCep(false) }
    }
  }

  const abrirNovo = () => { setForm(FORM_INICIAL); setEditando(null); setMostrarForm(true) }
  const abrirEditar = (p) => {
    setForm({
      nome: p.nome||'', cpf: p.cpf||'', data_nascimento: p.data_nascimento||'',
      telefone: p.telefone||'', email: p.email||'',
      cep: p.cep||'', logradouro: p.logradouro||'', numero: p.numero||'',
      complemento: p.complemento||'', bairro: p.bairro||'', cidade: p.cidade||'', estado: p.estado||'',
      plano_saude: p.plano_saude||'', numero_carteirinha: p.numero_carteirinha||'', observacoes: p.observacoes||''
    })
    setEditando(p.id)
    setMostrarForm(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome) { toast('Nome é obrigatório!', 'error'); return }
    setSalvando(true)
    try {
      if (editando) { await api.put(`/pacientes/${editando}`, form); toast('Paciente atualizado!', 'success') }
      else          { await api.post('/pacientes', form);             toast('Paciente cadastrado!', 'success') }
      setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL); carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
    finally { setSalvando(false) }
  }

  const excluir = async (id, nome) => {
    const ok = await confirmar({
      titulo: 'Excluir Paciente',
      mensagem: `Deseja excluir o paciente "${nome}"? Esta ação não pode ser desfeita.`,
      labelOk: 'Excluir',
      tipo: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/pacientes/${id}`)
      toast('Paciente excluído.', 'success')
      carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
  }

  const filtrados = pacientes.filter(p =>
    !busca || p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.cpf?.includes(busca) || p.email?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <PageLayout title='👥 Pacientes'>
      <ConfirmModalUI /><ToastUI />

      <div className='inner-toolbar'>
        <input className='form-input' style={{ maxWidth: '280px' }}
          placeholder='🔍 Buscar por nome, CPF ou email...'
          value={busca} onChange={e => setBusca(e.target.value)} />
        <button className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => { if (mostrarForm) { setMostrarForm(false); setEditando(null); setForm(FORM_INICIAL) } else abrirNovo() }}>
          {mostrarForm ? '✖ Cancelar' : '+ Novo Paciente'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>{editando ? '✏️ Editar Paciente' : 'Cadastrar Novo Paciente'}</h3>
          <form onSubmit={handleSubmit} className='inner-form'>

            <div className='form-field form-field--full'>
              <label className='form-label'>Nome completo <span className='required'>*</span></label>
              <input className='form-input' name='nome' value={form.nome} onChange={handleChange} placeholder='Nome do paciente' required />
            </div>
            <div className='form-field'>
              <label className='form-label'>CPF</label>
              <input className='form-input' name='cpf' value={form.cpf} onChange={handleChange} placeholder='000.000.000-00' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Data de Nascimento</label>
              <input className='form-input' type='date' name='data_nascimento' value={form.data_nascimento} onChange={handleChange} />
            </div>
            <div className='form-field'>
              <label className='form-label'>Telefone</label>
              <input className='form-input' name='telefone' value={form.telefone} onChange={handleChange} placeholder='(00) 00000-0000' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Email</label>
              <input className='form-input' type='email' name='email' value={form.email} onChange={handleChange} placeholder='email@exemplo.com' />
            </div>

            <div className='form-field form-field--full'>
              <div className='form-section-divider'><span>📍 Endereço</span></div>
            </div>
            <div className='form-field'>
              <label className='form-label'>CEP {buscandoCep && <span style={{color:'#38bdf8'}}>(buscando...)</span>}</label>
              <input className='form-input' name='cep' value={form.cep} onChange={handleCep} placeholder='00000-000' maxLength={9} />
            </div>
            <div className='form-field'>
              <label className='form-label'>Número</label>
              <input className='form-input' name='numero' value={form.numero} onChange={handleChange} placeholder='Nº' />
            </div>
            <div className='form-field form-field--full'>
              <label className='form-label'>Logradouro</label>
              <input className='form-input' name='logradouro' value={form.logradouro} onChange={handleChange} placeholder='Rua, Avenida...' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Complemento</label>
              <input className='form-input' name='complemento' value={form.complemento} onChange={handleChange} placeholder='Sala, Ap...' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Bairro</label>
              <input className='form-input' name='bairro' value={form.bairro} onChange={handleChange} placeholder='Bairro' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Cidade</label>
              <input className='form-input' name='cidade' value={form.cidade} onChange={handleChange} placeholder='Cidade' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Estado (UF)</label>
              <input className='form-input' name='estado' value={form.estado} onChange={handleChange} placeholder='UF' maxLength={2} style={{textTransform:'uppercase'}} />
            </div>

            <div className='form-field form-field--full'>
              <div className='form-section-divider'><span>🏥 Plano de Saúde</span></div>
            </div>
            <div className='form-field'>
              <label className='form-label'>Plano de Saúde</label>
              <input className='form-input' name='plano_saude' value={form.plano_saude} onChange={handleChange} placeholder='Nome do plano' />
            </div>
            <div className='form-field'>
              <label className='form-label'>Nº Carteirinha</label>
              <input className='form-input' name='numero_carteirinha' value={form.numero_carteirinha} onChange={handleChange} placeholder='Número' />
            </div>
            <div className='form-field form-field--full'>
              <label className='form-label'>Observações</label>
              <textarea className='form-textarea' name='observacoes' value={form.observacoes} onChange={handleChange} rows={3} placeholder='Observações gerais...' />
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
            <thead><tr>
              <th>Nome</th><th>CPF</th><th>Telefone</th><th>Plano</th><th>Ações</th>
            </tr></thead>
            <tbody>
              {filtrados.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',color:'#64748b',padding:'2rem'}}>Nenhum paciente encontrado.</td></tr>}
              {filtrados.map(p => (
                <tr key={p.id}>
                  <td style={{fontWeight:600}}>{p.nome}</td>
                  <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{p.cpf||'—'}</td>
                  <td>{p.telefone||'—'}</td>
                  <td style={{fontSize:'0.82rem',color:'#94a3b8'}}>{p.plano_saude||'—'}</td>
                  <td>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button className='btn btn-secondary' style={{fontSize:'0.78rem',padding:'5px 10px'}} onClick={() => abrirEditar(p)}>✏️ Editar</button>
                      <button className='btn btn-danger'    style={{fontSize:'0.78rem',padding:'5px 10px'}} onClick={() => excluir(p.id, p.nome)}>🗑️ Excluir</button>
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
