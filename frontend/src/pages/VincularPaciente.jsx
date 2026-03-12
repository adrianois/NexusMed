import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import PageLayout from '../components/PageLayout'

const API = import.meta.env.VITE_API_URL || 'https://nexusmed-backend.onrender.com'

export default function VincularPaciente() {
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  const [consultas, setConsultas]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null) // consulta selecionada
  const [modo, setModo]             = useState('buscar') // 'buscar' | 'novo'
  const [termo, setTermo]           = useState('')
  const [sugestoes, setSugestoes]   = useState([])
  const [buscando, setBuscando]     = useState(false)
  const [sucesso, setSucesso]       = useState('')
  const [erro, setErro]             = useState('')
  const [novoForm, setNovoForm]     = useState({ nome: '', cpf: '', telefone: '', email: '', data_nascimento: '' })

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/agendamento-publico/pendentes-vinculo`, { headers })
      setConsultas(data)
    } catch { setErro('Erro ao carregar consultas pendentes.') }
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [])

  const buscarPacientes = async (t) => {
    setTermo(t)
    if (t.length < 2) return setSugestoes([])
    setBuscando(true)
    try {
      const { data } = await axios.get(`${API}/agendamento-publico/sugerir-paciente?termo=${t}`, { headers })
      setSugestoes(data)
    } catch {}
    setBuscando(false)
  }

  const vincular = async (paciente_id) => {
    setErro('')
    try {
      await axios.patch(`${API}/agendamento-publico/vincular/${modal.id}`, { paciente_id }, { headers })
      setSucesso('Paciente vinculado com sucesso!')
      setModal(null)
      carregar()
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao vincular.') }
  }

  const criarEVincular = async () => {
    if (!novoForm.nome) return setErro('Nome é obrigatório.')
    setErro('')
    try {
      await axios.post(`${API}/agendamento-publico/criar-e-vincular/${modal.id}`, novoForm, { headers })
      setSucesso('Paciente criado e vinculado com sucesso!')
      setModal(null)
      carregar()
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao criar paciente.') }
  }

  const abrirModal = (c) => {
    setModal(c); setModo('buscar'); setTermo(''); setSugestoes([])
    setNovoForm({ nome: '', cpf: '', telefone: '', email: '', data_nascimento: '' })
    setErro(''); setSucesso('')
  }

  const fmt = (iso) => { if (!iso) return '—'; const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}` }

  return (
    <PageLayout>
      <div style={s.container}>
        <div style={s.header}>
          <div>
            <h1 style={s.titulo}>🔗 Vincular Pacientes</h1>
            <p style={s.sub}>Consultas agendadas online sem paciente cadastrado</p>
          </div>
          <span style={s.badge}>{consultas.length} pendente{consultas.length !== 1 ? 's' : ''}</span>
        </div>

        {sucesso && <div style={s.sucessoBox}>{sucesso}</div>}
        {erro    && <div style={s.erroBox}>{erro}</div>}

        {loading ? <p style={s.vazio}>Carregando...</p>
          : consultas.length === 0
          ? <div style={s.vazio}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <p>Nenhuma consulta pendente de vínculo.</p>
            </div>
          : <div style={s.lista}>
              {consultas.map(c => (
                <div key={c.id} style={s.card}>
                  <div style={s.cardInfo}>
                    <div style={s.cardNome}>{c.observacoes?.match(/Paciente: ([^|]+)/)?.[1]?.trim() || 'Paciente não identificado'}</div>
                    <div style={s.cardMeta}>
                      <span>📅 {fmt(c.data_consulta)} às {c.horario}</span>
                      <span>📋 {c.motivo}</span>
                    </div>
                    {c.observacoes && <div style={s.cardObs}>{c.observacoes}</div>}
                  </div>
                  <button style={s.btnVincular} onClick={() => abrirModal(c)}>Vincular →</button>
                </div>
              ))}
            </div>
        }

        {/* Modal de vínculo */}
        {modal && (
          <div style={s.overlay} onClick={() => setModal(null)}>
            <div style={s.modalBox} onClick={e => e.stopPropagation()}>
              <div style={s.modalHeader}>
                <h2 style={s.modalTitulo}>Vincular Paciente</h2>
                <button style={s.fechar} onClick={() => setModal(null)}>✕</button>
              </div>

              <div style={s.modalInfo}>
                <strong>{fmt(modal.data_consulta)}</strong> às <strong>{modal.horario}</strong> — {modal.motivo}
              </div>

              {/* Abas */}
              <div style={s.abas}>
                <button style={{ ...s.aba, ...(modo === 'buscar' ? s.abaAtiva : {}) }} onClick={() => setModo('buscar')}>🔍 Buscar Existente</button>
                <button style={{ ...s.aba, ...(modo === 'novo' ? s.abaAtiva : {}) }} onClick={() => setModo('novo')}>➕ Criar Novo</button>
              </div>

              {erro && <div style={s.erroBox}>{erro}</div>}

              {/* Buscar paciente existente */}
              {modo === 'buscar' && (
                <div>
                  <input
                    placeholder='Buscar por nome, CPF ou telefone...'
                    value={termo}
                    onChange={e => buscarPacientes(e.target.value)}
                    style={s.input}
                    autoFocus
                  />
                  {buscando && <p style={s.hint}>Buscando...</p>}
                  {sugestoes.length === 0 && termo.length >= 2 && !buscando && (
                    <p style={s.hint}>Nenhum paciente encontrado. Tente criar um novo cadastro.</p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {sugestoes.map(p => (
                      <div key={p.id} style={s.sugestaoItem}>
                        <div>
                          <div style={s.pacNome}>{p.nome}</div>
                          <div style={s.pacMeta}>
                            {p.cpf && <span>CPF: {p.cpf}</span>}
                            {p.telefone && <span> | Tel: {p.telefone}</span>}
                          </div>
                        </div>
                        <button style={s.btnOk} onClick={() => vincular(p.id)}>Vincular</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Criar novo paciente */}
              {modo === 'novo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[['nome','Nome completo *','text'],['cpf','CPF','text'],['telefone','Telefone','text'],['email','E-mail','email'],['data_nascimento','Data de nascimento','date']].map(([campo, label, tipo]) => (
                    <div key={campo}>
                      <label style={s.label}>{label}</label>
                      <input type={tipo} placeholder={label} value={novoForm[campo]}
                        onChange={e => setNovoForm(f => ({ ...f, [campo]: e.target.value }))}
                        style={s.input} />
                    </div>
                  ))}
                  <button style={s.btnCriar} onClick={criarEVincular}>✅ Criar e Vincular</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

const s = {
  container:   { padding: '28px 24px', maxWidth: 860, margin: '0 auto' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  titulo:      { margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9' },
  sub:         { margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' },
  badge:       { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 20, padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700, alignSelf: 'center' },
  lista:       { display: 'flex', flexDirection: 'column', gap: 12 },
  card:        { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  cardInfo:    { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  cardNome:    { color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' },
  cardMeta:    { display: 'flex', gap: 16, color: '#94a3b8', fontSize: '0.82rem', flexWrap: 'wrap' },
  cardObs:     { color: '#475569', fontSize: '0.75rem', marginTop: 2 },
  btnVincular: { background: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modalBox:    { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { margin: 0, color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700 },
  fechar:      { background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' },
  modalInfo:   { background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px', color: '#94a3b8', fontSize: '0.85rem', marginBottom: 20 },
  abas:        { display: 'flex', gap: 8, marginBottom: 16 },
  aba:         { flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#64748b', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 },
  abaAtiva:    { background: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6', color: '#60a5fa' },
  input:       { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', padding: '10px 14px', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  label:       { display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  hint:        { color: '#475569', fontSize: '0.8rem', marginTop: 6 },
  sugestaoItem:{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  pacNome:     { color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' },
  pacMeta:     { color: '#64748b', fontSize: '0.75rem', marginTop: 2 },
  btnOk:       { background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' },
  btnCriar:    { background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', marginTop: 4 },
  erroBox:     { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: '0.875rem' },
  sucessoBox:  { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: '0.875rem' },
  vazio:       { color: '#475569', fontSize: '0.875rem', textAlign: 'center', padding: '48px 0' },
}
