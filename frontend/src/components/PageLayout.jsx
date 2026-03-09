import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import './PageLayout.css'

export default function PageLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [nomeClinica, setNomeClinica] = useState('')

  // Busca nome da clínica para gestor
  useEffect(() => {
    if (user?.perfil === 'gestor' && user?.clinica_id) {
      api.get('/gestor/minha-clinica')
        .then(r => { if (r.data?.nome) setNomeClinica(r.data.nome) })
        .catch(() => {})
    }
  }, [user])

  const menuNormal = [
    { to: '/dashboard',   icon: '🏠', label: 'Início' },
    { to: '/pacientes',   icon: '👥', label: 'Pacientes' },
    { to: '/consultas',   icon: '📅', label: 'Consultas' },
    { to: '/prontuarios', icon: '📋', label: 'Prontuários' },
  ]

  const menuAdmin = [
    { to: '/admin',           icon: '🛡️', label: 'Painel Admin' },
    { to: '/admin/clinicas',  icon: '🏨', label: 'Clínicas' },
    { to: '/admin/usuarios',  icon: '👤', label: 'Usuários' },
  ]

  const menuGestor = [
    { to: '/gestor',          icon: '📊', label: 'Painel Gestor' },
    { to: '/gestor/usuarios', icon: '⏳', label: 'Aprovar Usuários' },
    { to: '/pacientes',       icon: '👥', label: 'Pacientes' },
    { to: '/consultas',       icon: '📅', label: 'Consultas' },
    { to: '/prontuarios',     icon: '📋', label: 'Prontuários' },
  ]

  const perfil = user?.perfil
  const menu = perfil === 'admin' ? menuAdmin : perfil === 'gestor' ? menuGestor : menuNormal

  const badgeColor = perfil === 'admin' ? '#e74c3c' : perfil === 'gestor' ? '#f39c12' : '#27ae60'
  const badgeLabel = perfil === 'admin' ? 'Admin' : perfil === 'gestor' ? 'Gestor' : 'Usuário'

  return (
    <div className='layout'>
      <aside className='sidebar'>
        <div className='sidebar-logo' onClick={() => navigate(perfil === 'admin' ? '/admin' : perfil === 'gestor' ? '/gestor' : '/dashboard')}>
          <span className='sidebar-logo-icon'>🏥</span>
          <span className='sidebar-logo-text'>NexusMed</span>
        </div>

        {/* Banner da clínica para gestor */}
        {perfil === 'gestor' && (
          <div className='sidebar-clinica-banner'>
            <span className='sidebar-clinica-icon'>🏨</span>
            <div className='sidebar-clinica-info'>
              <span className='sidebar-clinica-label'>Clínica</span>
              <span className='sidebar-clinica-nome'>{nomeClinica || 'Carregando...'}</span>
            </div>
          </div>
        )}

        <nav className='sidebar-nav'>
          {menu.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
              <span className='sidebar-icon'>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className='sidebar-footer'>
          <div className='sidebar-user'>
            <span className='sidebar-user-name'>{user?.nome || user?.email || 'Usuário'}</span>
            <span className='sidebar-badge' style={{ background: badgeColor }}>{badgeLabel}</span>
          </div>
          <button className='sidebar-logout' onClick={logout}>Sair</button>
        </div>
      </aside>

      <main className='content'>
        <div className='page-header'><h2 className='page-title'>{title}</h2></div>
        <div className='page-body'>{children}</div>
      </main>
    </div>
  )
}
