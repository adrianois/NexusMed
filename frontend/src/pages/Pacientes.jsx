import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import './InnerPage.css'

const FORM_INICIAL = {
  nome:'', cpf:'', data_nascimento:'', telefone:'', email:'',
  cep:'', logradouro:'', numero:'', complemento:'', bairro:'', cidade:'', estado:''
}

export default function Pacientes() {
  const [pacientes, setPacientes]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [form, setForm]               = useState(FORM_INICIAL)
  const [editandoId, setEditandoId]   = useState(null)

  const carregar = () => {
    setLoading(true)
    api.get('/pacientes').then(r=>setPacientes(r.data||[])).catch(()=>setErro('Erro ao carregar.')).finally(()=>setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const handleChange = e => setForm(prev=>({...prev,[e.target.name]:e.target.value}))

  const handleCep = async e => {
    const cep = e.target.value.replace(/\D/g,'')
    setForm(prev=>({...prev, cep:e.target.value}))
    if (cep.length===8) {
      setBuscandoCep(true)
      try {
        const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) setForm(prev=>({...prev, logradouro:data.logradouro||'', bairro:data.bairro||'', cidade:data.localidade||'', estado:data.uf||''}))
      } catch {} finally { setBuscandoCep(false) }
    }
  }

  const abrirEdicao = p => {
    setForm({ nome:p.nome||'', cpf:p.cpf||'', data_nascimento:p.data_nascimento||'', telefone:p.telefone||'',
      email:p.email||'', cep:p.cep||'', logradouro:p.logradouro||'', numero:p.numero||'',
      complemento:p.complemento||'', bairro:p.bairro||'', cidade:p.cidade||'', estado:p.estado||'' })
    setEditandoId(p.id)
    setMostrarForm(true)
    window.scrollTo({top:0,behavior:'smooth'})
  }

  const cancelar = () => { setMostrarForm(false); setForm(FORM_INICIAL); setEditandoId(null) }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome||!form.cpf) return alert('Nome e CPF são obrigatórios!')
    setSalvando(true)
    try {
      if (editandoId) await api.put(`/pacientes/${editandoId}`, form)
      else            await api.post('/pacientes', form)
      cancelar(); carregar()
    } catch (err) { alert('Erro: '+(err.response?.data?.error||err.message)) }
    finally { setSalvando(false) }
  }

  const excluir = async p => {
    if (!confirm(`Excluir o paciente "${p.nome}"?\n\nEsta ação não pode ser desfeita.`)) return
    try {
      await api.delete(`/pacientes/${p.id}`)
      carregar()
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      alert(`❌ Não foi possível excluir: ${msg}`)
    }
  }

  const enderecoFormatado = p =>
    [p.logradouro,p.numero,p.bairro,p.cidade,p.estado].filter(Boolean).join(', ') || '—'

  return (
    <PageLayout title='👥 Pacientes'>
      <div className='inner-toolbar'>
        <button className={`btn ${mostrarForm?'btn-secondary':'btn-primary'}`} onClick={()=>{if(mostrarForm)cancelar();else setMostrarForm(true)}}>
          {mostrarForm ? '✖ Cancelar' : '+ Novo Paciente'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>{editandoId ? '✏️ Editar Paciente' : 'Cadastrar Novo Paciente'}</h3>
          <form onSubmit={handleSubmit} className='inner-form'>
            <div className='form-field'>
              <label className='form-label'>Nome <span className='required'>*</span></label>
              <input className='form-input' name='nome' value={form.nome} onChange={handleChange} placeholder='Nome completo' required />
            </div>
            <div className='form-field'>
              <label className='form-label'>CPF <span className='required'>*</span></label>
              <input className='form-input' name='cpf' value={form.cpf} onChange={handleChange} placeholder='000.000.000-00' required />
            </div>
            <div className='form-field'>
              <label className='form-label'>Data de Nascimento</label>
              <input className='form-input' type='date' name='data_nascimento' value={form.data_nascimento} onChange={handleChange} />
            </div>
            <div className='form-field'>
              <label className='form-label'>Telefone</label>
              <input className='form-input' name='telefone' value={form.telefone} onChange={handleChange} placeholder='(00) 00000-0000' />
            </div>
            <div className='form-field form-field--full'>
              <label className='form-label'>Email</label>
              <input className='form-input' type='email' name='email' value={form.email} onChange={handleChange} placeholder='exemplo@email.com' />
            </div>
            <div className='form-field form-field--full'>
              <div className='form-section-divider'><span>📍 Endereço</span></div>
            </div>
            <div className='form-field'>
              <label className='form-label'>CEP {buscandoCep&&<span style={{color:'#38bdf8',fontWeight:400}}>(buscando...)</span>}</label>
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
              <input className='form-input' name='complemento' value={form.complemento} onChange={handleChange} placeholder='Apto, Bloco...' />
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
            <div className='form-actions'>
              <button type='submit' className='btn btn-success' disabled={salvando}>{salvando?'Salvando...':editandoId?'✓ Salvar Alterações':'✓ Salvar Paciente'}</button>
              <button type='button' className='btn btn-secondary' onClick={cancelar}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {erro    && <p className='page-erro'>{erro}</p>}

      {!loading && !erro && (
        pacientes.length===0
          ? (<div className='page-vazio-box'><span className='page-vazio-icon'>👥</span><p>Nenhum paciente cadastrado.</p><button className='btn btn-primary' onClick={()=>setMostrarForm(true)}>+ Cadastrar primeiro paciente</button></div>)
          : (
            <div className='table-wrapper'>
              <table className='data-table'>
                <thead><tr><th>Nome</th><th>CPF</th><th>Nascimento</th><th>Telefone</th><th>Endereço</th><th>Ações</th></tr></thead>
                <tbody>
                  {pacientes.map(p=>(
                    <tr key={p.id}>
                      <td style={{fontWeight:600}}>{p.nome}</td>
                      <td style={{color:'#94a3b8'}}>{p.cpf}</td>
                      <td>{p.data_nascimento||'—'}</td>
                      <td>{p.telefone||'—'}</td>
                      <td style={{fontSize:'0.8rem',color:'#94a3b8'}}>{enderecoFormatado(p)}</td>
                      <td>
                        <div style={{display:'flex',gap:'6px'}}>
                          <button className='btn btn-primary' style={{fontSize:'0.72rem',padding:'4px 10px'}} onClick={()=>abrirEdicao(p)}>✏️ Editar</button>
                          <button className='btn btn-danger'  style={{fontSize:'0.72rem',padding:'4px 10px'}} onClick={()=>excluir(p)}>🗑️ Excluir</button>
                        </div>
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
