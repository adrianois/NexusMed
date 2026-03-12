import { useEffect, useState } from 'react'
import api from '../../api'
import PageLayout from '../../components/PageLayout'
import { useConfirm } from '../../components/ConfirmModal'
import { useToast } from '../../components/Toast'

const FORM_INICIAL = {
  nome: '', cnpj: '', telefone: '', email: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  usa_triagem: false
}

export default function AdminClinicas() {
  const [clinicas,    setClinicas]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null) // id da clínica em edição
  const [salvando,    setSalvando]    = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [form,        setForm]        = useState(FORM_INICIAL)
  const { confirmar,  ConfirmModalUI} = useConfirm()
  const { toast,      ToastUI }       = useToast()

  const carregar = () => {
    setLoading(true)
    api.get('/admin/clinicas').then(r => setClinicas(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleCep = async (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setForm(prev => ({ ...prev, cep: e.target.value }))
    if (raw.length === 8) {
      setBuscandoCep(true)
      try {
        const res  = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
        const data = await res.json()
        if (!data.erro) setForm(prev => ({ ...prev, logradouro: data.logradouro||'', bairro: data.bairro||'', cidade: data.localidade||'', estado: data.uf||'' }))
      } catch {} finally { setBuscandoCep(false) }
    }
  }

  const abrirNovo = () => {
    setForm(FORM_INICIAL)
    setEditando(null)
    setMostrarForm(true)
  }

  const abrirEditar = (c) => {
    setForm({
      nome:        c.nome        || '',
      cnpj:        c.cnpj        || '',
      telefone:    c.telefone    || '',
      email:       c.email       || '',
      cep:         c.cep         || '',
      logradouro:  c.logradouro  || '',
      numero:      c.numero      || '',
      complemento: c.complemento || '',
      bairro:      c.bairro      || '',
      cidade:      c.cidade      || '',
      estado:      c.estado      || '',
      usa_triagem: c.usa_triagem || false,
    })
    setEditando(c.id)
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => {
    setMostrarForm(false)
    setEditando(null)
    setForm(FORM_INICIAL)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome || !form.cnpj) { toast('Nome e CNPJ são obrigatórios!', 'error'); return }
    setSalvando(true)
    const enderecoStr = [form.logradouro, form.numero, form.bairro, form.cidade, form.estado].filter(Boolean).join(', ')
    try {
      if (editando) {
        await api.put(`/admin/clinicas/${editando}`, { ...form, endereco: enderecoStr })
        toast('Clínica atualizada com sucesso!', 'success')
      } else {
        await api.post('/admin/clinicas', { ...form, endereco: enderecoStr })
        toast('Clínica cadastrada com sucesso!', 'success')
      }
      cancelar(); carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
    finally { setSalvando(false) }
  }

  const excluir = async (id, nome) => {
    const ok = await confirmar({
      titulo:   'Excluir Clínica',
      mensagem: `Deseja excluir permanentemente a clínica "${nome}"? Esta ação não pode ser desfeita.`,
      labelOk:  'Excluir',
      tipo:     'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/admin/clinicas/${id}`)
      toast('Clínica excluída com sucesso.', 'success')
      carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
  }

  const toggleStatus = async (id, ativo, nome) => {
    const ok = await confirmar({
      titulo:   ativo ? 'Desativar Clínica' : 'Ativar Clínica',
      mensagem: `Deseja ${ativo ? 'desativar' : 'ativar'} a clínica "${nome}"?`,
      labelOk:  ativo ? 'Desativar' : 'Ativar',
      tipo:     ativo ? 'warning' : 'success',
    })
    if (!ok) return
    try {
      await api.patch(`/admin/clinicas/${id}/status`, { ativo: !ativo })
      toast(`Clínica ${!ativo ? 'ativada' : 'desativada'}.`, 'success')
      carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
  }

  const toggleTriagem = async (id, usa_triagem, nome) => {
    try {
      await api.patch(`/admin/clinicas/${id}/triagem`, { usa_triagem: !usa_triagem })
      toast(`Triagem ${!usa_triagem ? 'ativada' : 'desativada'} para "${nome}".`, 'success')
      carregar()
    } catch (err) { toast('Erro: ' + (err.response?.data?.error || err.message), 'error') }
  }

  return (
    <PageLayout title='🏥 Gerenciar Clínicas'>
      <ConfirmModalUI /><ToastUI />

      <div className='inner-toolbar'>
        <button className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`} onClick={() => mostrarForm ? cancelar() : abrirNovo()}>
          {mostrarForm ? '✖ Cancelar' : '+ Nova Clínica'}
        </button>
      </div>

      {mostrarForm && (
        <div className='inner-card'>
          <h3 className='inner-card-title'>{editando ? '✏️ Editar Clínica' : 'Cadastrar Nova Clínica'}</h3>
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
              <label className='form-label'>Email da Clínica</label>
              <input className='form-input' type='email' name='email' value={form.email} onChange={handleChange} placeholder='contato@clinica.com.br' />
            </div>
            <div className='form-field form-field--full'>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type='checkbox' name='usa_triagem' checked={form.usa_triagem} onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 500 }}>
                  🩺 Esta clínica realiza <strong>triagem / pré-atendimento</strong>
                </span>
              </label>
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
              <input className='form-input' name='complemento' value={form.complemento} onChange={handleChange} placeholder='Sala, Andar...' />
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
              <button type='submit' className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando...' : editando ? '✓ Atualizar Clínica' : '✓ Salvar Clínica'}
              </button>
              <button type='button' className='btn btn-secondary' onClick={cancelar}>Cancelar</button>
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
                <th>Nome</th><th>CNPJ</th><th>Telefone</th><th>Endereço</th>
                <th>Triagem</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clinicas.length === 0 && (
                <tr><td colSpan={7} style={{textAlign:'center',color:'#64748b',padding:'2rem'}}>Nenhuma clínica cadastrada.</td></tr>
              )}
              {clinicas.map(c => (
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.nome}</td>
                  <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{c.cnpj}</td>
                  <td>{c.telefone||'—'}</td>
                  <td style={{fontSize:'0.8rem',color:'#94a3b8',maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {c.logradouro ? `${c.logradouro}${c.numero ? ', '+c.numero : ''}${c.cidade ? ' — '+c.cidade : ''}` : '—'}
                  </td>
                  <td>
                    <button onClick={() => toggleTriagem(c.id, c.usa_triagem, c.nome)} style={{
                      background: c.usa_triagem ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.1)',
                      border: `1px solid ${c.usa_triagem ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.2)'}`,
                      color: c.usa_triagem ? '#4ade80' : '#64748b',
                      borderRadius: '20px', padding: '3px 12px',
                      fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{c.usa_triagem ? '🩺 Sim' : '— Não'}</button>
                  </td>
                  <td>
                    <span className={`badge badge-${c.ativo ? 'ativo' : 'inativo'}`}>{c.ativo ? 'Ativa' : 'Inativa'}</span>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                      {/* Editar */}
                      <button className='btn btn-secondary' style={{fontSize:'0.78rem',padding:'5px 10px'}}
                        onClick={() => abrirEditar(c)} title='Editar clínica'>
                        ✏️ Editar
                      </button>
                      {/* Ativar / Desativar */}
                      <button className={`btn btn-${c.ativo ? 'warning' : 'success'}`}
                        style={{fontSize:'0.78rem',padding:'5px 10px'}}
                        onClick={() => toggleStatus(c.id, c.ativo, c.nome)}>
                        {c.ativo ? '⏸ Desativar' : '▶ Ativar'}
                      </button>
                      {/* Excluir */}
                      <button className='btn btn-danger' style={{fontSize:'0.78rem',padding:'5px 10px'}}
                        onClick={() => excluir(c.id, c.nome)} title='Excluir clínica'>
                        🗑️ Excluir
                      </button>
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
