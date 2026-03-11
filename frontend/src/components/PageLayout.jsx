import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import './PageLayout.css'

export default function PageLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [nomeClinica, setNomeClinica] = useState('')
  const [usaTriagem,  setUsaTriagem]  = useState(false)

  useEffect(() => {
    const perfil = user?.perfil
    if ((perfil === 'gestor' || perfil === 'normal') && user?.clinica_id) {
      api.get('/gestor/minha-clinica')
        .then(r => {
          if (r.data?.nome)        setNomeClinica(r.data.nome)
          if (r.data?.usa_triagem) setUsaTriagem(r.data.usa_triagem)
        })
        .catch(() => {
          api.get('/clinicas')
            .then(r => {
              const c = (r.data || []).find(x => x.id === user.clinica_id)
              if (c) { setNomeClinica(c.nome); setUsaTriagem(c.usa_triagem || false) }
            })
            .catch(() => {})
        })
    }
  }, [user])

  // ─── Menus por perfil ────────────────────────────────────────────────
  const menuMedico = [
    { to: '/medico',           icon: '🏥', label: 'Painel'       },
    { to: '/medico/agenda',    icon: '📅', label: 'Agenda'       },
    { to: '/medico/triagem',   icon: '🩺', label: 'Fila Triagem' },
    { to: '/medico/historico', icon: '📋', label: 'Histórico'    },
    { to: '/minha-senha',      icon: '🖐', label: 'Minha Senha' },
  ]

  const menuAdmin = [
    { to: '/admin',          icon: '🛡️', label: 'Painel Admin'  },
    { to: '/admin/clinicas', icon: '🏥', label: 'Clínicas'      },
    { to: '/admin/usuarios', icon: '👤', label: 'Usuários'      },
    { to: '/medicos',        icon: '👨‍⚕️', label: 'Médicos'     },
    { to: '/pacientes',      icon: '👥', label: 'Pacientes'    },
    { to: '/consultas',      icon: '📅', label: 'Consultas'    },
    { to: '/prontuarios',    icon: '📋', label: 'Prontuários' },
    { to: '/triagem',        icon: '🩺', label: 'Triagem'      },
    { to: '/logs',           icon: '📝', label: 'Logs'         },
    { to: '/minha-senha',    icon: '🖐', label: 'Minha Senha' },
  ]

  const menuGestorBase = [
    { to: '/gestor',              icon: '📊', label: 'Painel Gestor'    },
    { to: '/gestor/usuarios',     icon: '⏳', label: 'Aprovar Usuários' },
    { to: '/gestor/logs',         icon: '📋', label: 'Logs da Clínica' },
    { to: '/gestor/trocar-senha', icon: '🔑', label: 'Gerenciar Senhas'},
    { to: '/medicos',             icon: '👨‍⚕️', label: 'Médicos'        },
    { to: '/pacientes',           icon: '👥', label: 'Pacientes'       },
    { to: '/consultas',           icon: '📅', label: 'Consultas'       },
    { to: '/prontuarios',         icon: '📋', label: 'Prontuários'     },
    { to: '/minha-senha',         icon: '🖐', label: 'Minha Senha'     },
  ]

  const menuNormalBase = [
    { to: '/dashboard',   icon: '🏠', label: 'Início'      },
    { to: '/medicos',     icon: '👨‍⚕️', label: 'Médicos'    },
    { to: '/pacientes',   icon: '👥', label: 'Pacientes'  },
    { to: '/consultas',   icon: '📅', label: 'Consultas'  },
    { to: '/prontuarios', icon: '📋', label: 'Prontuários'},
    { to: '/minha-senha', icon: '🖐', label: 'Minha Senha'},
  ]

  const perfil = user?.perfil

  const menuGestor = usaTriagem
    ? [...menuGestorBase.slice(0, 3), { to: '/triagem', icon: '🩺', label: 'Triagem' }, ...menuGestorBase.slice(3)]
    : menuGestorBase

  const menuNormalFinal = usaTriagem
    ? [...menuNormalBase.slice(0, 4), { to: '/triagem', icon: '🩺', label: 'Triagem' }, ...menuNormalBase.slice(4)]
    : menuNormalBase

  // Seleciona menu correto por perfil (inclui medico)
  const menu =
    perfil === 'admin'  ? menuAdmin :
    perfil === 'gestor' ? menuGestor :
    perfil === 'medico' ? menuMedico :   // ← ADICIONADO
    menuNormalFinal

  const badgeColor =
    perfil === 'admin'  ? '#e74c3c' :
    perfil === 'gestor' ? '#f39c12' :
    perfil === 'medico' ? '#4ade80' :   // ← verde para médico
    '#27ae60'

  const badgeLabel =
    perfil === 'admin'  ? 'Admin'  :
    perfil === 'gestor' ? 'Gestor' :
    perfil === 'medico' ? 'Médico' :  // ← ADICIONADO
    'Usuário'

  const homeRoute =
    perfil === 'admin'  ? '/admin'    :
    perfil === 'gestor' ? '/gestor'   :
    perfil === 'medico' ? '/medico'   :  // ← ADICIONADO
    '/dashboard'

  const mostrarBannerClinica = (perfil === 'gestor' || perfil === 'normal') && user?.clinica_id

  return (
    <div className='layout'>
      <aside className='sidebar'>
        <div className='sidebar-logo' onClick={() => navigate(homeRoute)}>
          <span className='sidebar-logo-icon'>🏥</span>
          <span className='sidebar-logo-text'>NexusMed</span>
        </div>

        {mostrarBannerClinica && (
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
            <NavLink
              key={item.to}
              to={item.to}
              end={['/dashboard', '/admin', '/gestor', '/medico'].includes(item.to)}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
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
