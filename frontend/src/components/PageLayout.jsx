import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import './PageLayout.css'

export default function PageLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [nomeClinica, setNomeClinica] = useState('')

  useEffect(() => {
    const perfil = user?.perfil
    if ((perfil === 'gestor' || perfil === 'normal') && user?.clinica_id) {
      api.get('/gestor/minha-clinica')
        .then(r => { if (r.data?.nome) setNomeClinica(r.data.nome) })
        .catch(() => {
          api.get('/clinicas')
            .then(r => {
              const c = (r.data || []).find(x => x.id === user.clinica_id)
              if (c) setNomeClinica(c.nome)
            })
            .catch(() => {})
        })
    }
  }, [user])

  const menuNormal = [
    { to: '/dashboard',   icon: '\uD83C\uDFE0', label: 'In\u00edcio' },
    { to: '/medicos',     icon: '\uD83D\uDC68\u200D\u2695\uFE0F', label: 'M\u00e9dicos' },
    { to: '/pacientes',   icon: '\uD83D\uDC65', label: 'Pacientes' },
    { to: '/consultas',   icon: '\uD83D\uDCC5', label: 'Consultas' },
    { to: '/prontuarios', icon: '\uD83D\uDCCB', label: 'Prontu\u00e1rios' },
    { to: '/minha-senha', icon: '\uD83D\uDD10', label: 'Minha Senha' },
  ]

  const menuAdmin = [
    { to: '/admin',          icon: '\uD83D\uDEE1\uFE0F', label: 'Painel Admin' },
    { to: '/admin/clinicas', icon: '\uD83C\uDFC8', label: 'Cl\u00ednicas' },
    { to: '/admin/usuarios', icon: '\uD83D\uDC64', label: 'Usu\u00e1rios' },
    { to: '/medicos',        icon: '\uD83D\uDC68\u200D\u2695\uFE0F', label: 'M\u00e9dicos' },
    { to: '/pacientes',      icon: '\uD83D\uDC65', label: 'Pacientes' },
    { to: '/consultas',      icon: '\uD83D\uDCC5', label: 'Consultas' },
    { to: '/prontuarios',    icon: '\uD83D\uDCCB', label: 'Prontu\u00e1rios' },
    { to: '/logs',           icon: '\uD83D\uDCDD', label: 'Logs' },
    { to: '/minha-senha',    icon: '\uD83D\uDD10', label: 'Minha Senha' },
  ]

  const menuGestor = [
    { to: '/gestor',              icon: '\uD83D\uDCCA', label: 'Painel Gestor' },
    { to: '/gestor/usuarios',     icon: '\u23F3',      label: 'Aprovar Usu\u00e1rios' },
    { to: '/gestor/logs',         icon: '\uD83D\uDCCB', label: 'Logs da Cl\u00ednica' },
    { to: '/gestor/trocar-senha', icon: '\uD83D\uDD11', label: 'Gerenciar Senhas' },
    { to: '/medicos',             icon: '\uD83D\uDC68\u200D\u2695\uFE0F', label: 'M\u00e9dicos' },
    { to: '/pacientes',           icon: '\uD83D\uDC65', label: 'Pacientes' },
    { to: '/consultas',           icon: '\uD83D\uDCC5', label: 'Consultas' },
    { to: '/prontuarios',         icon: '\uD83D\uDCCB', label: 'Prontu\u00e1rios' },
    { to: '/minha-senha',         icon: '\uD83D\uDD10', label: 'Minha Senha' },
  ]

  const perfil = user?.perfil
  const menu = perfil === 'admin' ? menuAdmin : perfil === 'gestor' ? menuGestor : menuNormal

  const badgeColor = perfil === 'admin' ? '#e74c3c' : perfil === 'gestor' ? '#f39c12' : '#27ae60'
  const badgeLabel = perfil === 'admin' ? 'Admin' : perfil === 'gestor' ? 'Gestor' : 'Usu\u00e1rio'
  const homeRoute  = perfil === 'admin' ? '/admin' : perfil === 'gestor' ? '/gestor' : '/dashboard'
  const mostrarBannerClinica = (perfil === 'gestor' || perfil === 'normal') && user?.clinica_id

  return (
    <div className='layout'>
      <aside className='sidebar'>
        <div className='sidebar-logo' onClick={() => navigate(homeRoute)}>
          <span className='sidebar-logo-icon'>\uD83C\uDFE5</span>
          <span className='sidebar-logo-text'>NexusMed</span>
        </div>

        {mostrarBannerClinica && (
          <div className='sidebar-clinica-banner'>
            <span className='sidebar-clinica-icon'>\uD83C\uDFC8</span>
            <div className='sidebar-clinica-info'>
              <span className='sidebar-clinica-label'>Cl\u00ednica</span>
              <span className='sidebar-clinica-nome'>{nomeClinica || 'Carregando...'}</span>
            </div>
          </div>
        )}

        <nav className='sidebar-nav'>
          {menu.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={['/dashboard','/admin','/gestor'].includes(item.to)}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <span className='sidebar-icon'>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className='sidebar-footer'>
          <div className='sidebar-user'>
            <span className='sidebar-user-name'>{user?.nome || user?.email || 'Usu\u00e1rio'}</span>
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
