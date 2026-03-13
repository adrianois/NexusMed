import { useEffect, useRef, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import './InnerPage.css'

const FORM_VAZIO = { nome: '', cnpj: '', endereco: '', cidade: '', estado: '', telefone: '', email: '', logo_url: '' }

export default function Clinicas() {
  const [clinicas,     setClinicas]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [erro,         setErro]         = useState(null)
  const [mostrarForm,  setMostrarForm]  = useState(false)
  const [salvando,     setSalvando]     = useState(false)
  const [editandoId,   setEditandoId]   = useState(null)
  const [form,         setForm]         = useState(FORM_VAZIO)
  const [previewLogo,  setPreviewLogo]  = useState(null)
  const inputFileRef = useRef(null)

  const carregarClinicas = () => {
    setLoading(true)
    api.get('/clinicas')
      .then(res => setClinicas(res.data || []))
      .catch(() => setErro('Erro ao carregar clínicas.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregarClinicas() }, [])

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  // Converte imagem selecionada para Base64
  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 300 * 1024) {
      alert('A imagem deve ter no máximo 300 KB. Redimensione e tente novamente.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result
      setForm(prev => ({ ...prev, logo_url: base64 }))
      setPreviewLogo(base64)
    }
    reader.readAsDataURL(file)
  }

  const removerLogo = () => {
    setForm(prev => ({ ...prev, logo_url: '' }))
    setPreviewLogo(null)
    if (inputFileRef.current) inputFileRef.current.value = ''
  }

  const abrirNovo = () => {
    setForm(FORM_VAZIO)
    setPreviewLogo(null)
    setEditandoId(null)
    setMostrarForm(true)
  }

  const abrirEditar = (c) => {
    setForm({
      nome:     c.nome     || '',
      cnpj:     c.cnpj     || '',
      endereco: c.endereco || '',
      cidade:   c.cidade   || '',
      estado:   c.estado   || '',
      telefone: c.telefone || '',
      email:    c.email    || '',
      logo_url: c.logo_url || '',
    })
    setPreviewLogo(c.logo_url || null)
    setEditandoId(c.id)
    setMostrarForm(true)
  }

  const fecharForm = () => {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setPreviewLogo(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome || !form.cnpj) return alert('Nome e CNPJ da clínica são obrigatórios!')
    setSalvando(true)
    try {
      if (editandoId) {
        await api.put(`/clinicas/${editandoId}`, form)
      } else {
        await api.post('/clinicas', form)
      }
      fecharForm()
      carregarClinicas()
    } catch (err) {
      alert('Erro ao salvar: ' + (err.response?.data?.error || err.message))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <PageLayout title="🏨 Clínicas">

      <div className="inner-toolbar">
        <button
          className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => mostrarForm ? fecharForm() : abrirNovo()}
        >
          {mostrarForm ? '✖ Cancelar' : '+ Nova Clínica'}
        </button>
      </div>

      {mostrarForm && (
        <div className="inner-card">
          <h3 className="inner-card-title">
            {editandoId ? '✏️ Editar Clínica' : 'Cadastrar Nova Clínica'}
          </h3>
          <form onSubmit={handleSubmit} className="inner-form">

            <div className="form-field form-field--full">
              <label className="form-label">Nome da Clínica <span className="required">*</span></label>
              <input className="form-input" type="text" name="nome"
                value={form.nome} onChange={handleChange}
                placeholder="Ex: Clínica Santa Maria" required />
            </div>

            <div className="form-field">
              <label className="form-label">CNPJ <span className="required">*</span></label>
              <input className="form-input" type="text" name="cnpj"
                value={form.cnpj} onChange={handleChange}
                placeholder="00.000.000/0000-00" required />
            </div>

            <div className="form-field">
              <label className="form-label">Telefone</label>
              <input className="form-input" type="tel" name="telefone"
                value={form.telefone} onChange={handleChange}
                placeholder="(00) 00000-0000" />
            </div>

            <div className="form-field">
              <label className="form-label">E-mail</label>
              <input className="form-input" type="email" name="email"
                value={form.email} onChange={handleChange}
                placeholder="contato@clinica.com" />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">Endereço</label>
              <input className="form-input" type="text" name="endereco"
                value={form.endereco} onChange={handleChange}
                placeholder="Rua, número, bairro" />
            </div>

            <div className="form-field">
              <label className="form-label">Cidade</label>
              <input className="form-input" type="text" name="cidade"
                value={form.cidade} onChange={handleChange}
                placeholder="Campo Grande" />
            </div>

            <div className="form-field">
              <label className="form-label">Estado (UF)</label>
              <input className="form-input" type="text" name="estado"
                value={form.estado} onChange={handleChange}
                placeholder="MS" maxLength={2} />
            </div>

            {/* ── Campo de Logomarca ── */}
            <div className="form-field form-field--full">
              <label className="form-label">🖼️ Logomarca da Clínica</label>
              <div style={{
                border: '2px dashed rgba(96,165,250,0.3)',
                borderRadius: '12px',
                padding: '16px',
                background: 'rgba(96,165,250,0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
              }}>

                {/* Preview */}
                <div style={{
                  width: '100px', height: '80px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  background: previewLogo ? '#fff' : 'rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {previewLogo
                    ? <img src={previewLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: '2rem', opacity: 0.3 }}>🏥</span>
                  }
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '10px', lineHeight: 1.5 }}>
                    Selecione a imagem da logomarca (PNG, JPG ou SVG).<br />
                    <strong style={{ color: '#94a3b8' }}>Tamanho máximo: 300 KB.</strong> O logo aparecerá nos PDFs gerados.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label style={{
                      background: 'rgba(96,165,250,0.15)',
                      border: '1px solid rgba(96,165,250,0.4)',
                      borderRadius: '8px',
                      color: '#60a5fa',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '7px 14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      📂 {previewLogo ? 'Trocar Logo' : 'Selecionar Logo'}
                      <input
                        ref={inputFileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {previewLogo && (
                      <button type="button" onClick={removerLogo} style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '8px',
                        color: '#f87171',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        padding: '7px 14px',
                        cursor: 'pointer',
                      }}>
                        🗑️ Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={salvando}>
                {salvando ? 'Salvando...' : editandoId ? '✓ Atualizar Clínica' : '✓ Salvar Clínica'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={fecharForm}>
                Cancelar
              </button>
            </div>

          </form>
        </div>
      )}

      {loading && <p className="page-loading">Carregando...</p>}
      {erro    && <p className="page-erro">{erro}</p>}

      {!loading && !erro && (
        clinicas.length === 0
          ? (
            <div className="page-vazio-box">
              <span className="page-vazio-icon">🏨</span>
              <p>Nenhuma clínica cadastrada ainda.</p>
              <button className="btn btn-primary" onClick={abrirNovo}>
                + Cadastrar primeira clínica
              </button>
            </div>
          )
          : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Logo</th>
                    <th>Nome</th>
                    <th>CNPJ</th>
                    <th>Cidade / UF</th>
                    <th>Telefone</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicas.map(c => (
                    <tr key={c.id}>
                      <td style={{ textAlign: 'center' }}>
                        {c.logo_url
                          ? <img src={c.logo_url} alt="Logo" style={{ height: '36px', maxWidth: '56px', objectFit: 'contain', borderRadius: '4px', background: '#fff', padding: '2px' }} />
                          : <span style={{ fontSize: '1.4rem', opacity: 0.3 }}>🏥</span>
                        }
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.nome}</td>
                      <td>{c.cnpj || '—'}</td>
                      <td>{[c.cidade, c.estado].filter(Boolean).join(' / ') || c.endereco || '—'}</td>
                      <td>{c.telefone || '—'}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          onClick={() => abrirEditar(c)}
                        >
                          ✏️ Editar
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
