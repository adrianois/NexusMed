import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import './Sidebar.css'

const menuItems = [
  { path: '/dashboard',       label: '🏠 Painel',            perfis: ['normal','gestor','admin','medico'] },
  { path: '/pacientes',       label: '👥 Pacientes',          perfis: ['normal','gestor','admin'] },
  { path: '/consultas',       label: '📅 Consultas',          perfis: ['normal','gestor','admin'] },
  { path: '/medicos',         label: '🩺 Médicos',            perfis: ['normal','gestor','admin'] },
  { path: '/triagem',         label: '🏥 Fila Triagem',       perfis: ['normal','gestor','admin'] },
  { path: '/retornos',        label: '🔁 Retornos',           perfis: ['normal','gestor','admin'] },
  { path: '/pos-atendimento', label: '📋 Pós-Atendimento',   perfis: ['normal','gestor','admin'] },
  { path: '/medico',          label: '🏠 Painel Médico',      perfis: ['medico'] },
  { path: '/medico/agenda',   label: '📅 Agenda',             perfis: ['medico'] },
  { path: '/medico/triagem',  label: '🏥 Triagem',            perfis: ['medico'] },
  { path: '/medico/historico',label: '📖 Histórico',          perfis: ['medico'] },
  { path: '/medico/documentos',label:'📄 Documentos',         perfis: ['medico'] },
  { path: '/medico/evolucao', label: '📈 Evolução',           perfis: ['medico'] },
  { path: '/gestor',          label: '📊 Painel Gestor',      perfis: ['gestor','admin'] },
  { path: '/gestor/usuarios', label: '👤 Usuários',           perfis: ['gestor','admin'] },
  { path: '/gestor/logs',     label: '📋 Logs',               perfis: ['gestor','admin'] },
  { path: '/admin',           label: '⚙️ Admin',              perfis: ['admin'] },
  { path: '/admin/clinicas',  label: '🏢 Clínicas',           perfis: ['admin'] },
  { path: '/admin/usuarios',  label: '👥 Usuários Admin',     perfis: ['admin'] },
  { path: '/minha-senha',     label: '🔑 Minha Senha',        perfis: ['normal','gestor','admin','medico'] },
]

export default function Sidebar({ perfil }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  // Fecha ao mudar de rota no mobile
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!e.target.closest('.sidebar') && !e.target.closest('.hamburger-btn')) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const itens = menuItems.filter(item => item.perfis.includes(perfil))

  return (
    <>
      {/* Botão hamburguer — só aparece no mobile */}
      <button
        className="hamburger-btn d-lg-none"
        onClick={() => setOpen(o => !o)}
        aria-label="Abrir menu"
      >
        <span /><span /><span />
      </button>

      {/* Overlay escuro ao abrir no mobile */}
      {open && <div className="sidebar-overlay d-lg-none" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <nav className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🏥 NexusMed</span>
          <button className="sidebar-close d-lg-none" onClick={() => setOpen(false)}>✕</button>
        </div>

        {itens.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            className={location.pathname === path ? 'active' : ''}
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
