import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLayout from '../components/PageLayout'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const perfil = user?.perfil

  // Cards por perfil
  const cardsNormal = [
    { icon: '👥', label: 'Pacientes',   desc: 'Gerenciar pacientes da clínica',  color: '#38bdf8', path: '/pacientes'   },
    { icon: '📅', label: 'Consultas',   desc: 'Agendar e ver consultas',         color: '#22c55e', path: '/consultas'   },
    { icon: '📋', label: 'Prontuários', desc: 'Registros médicos dos pacientes', color: '#f59e0b', path: '/prontuarios' },
  ]

  const cardsGestor = [
    { icon: '👥', label: 'Pacientes',        desc: 'Gerenciar pacientes',          color: '#38bdf8', path: '/pacientes'       },
    { icon: '📅', label: 'Consultas',        desc: 'Agendar e ver consultas',      color: '#22c55e', path: '/consultas'       },
    { icon: '📋', label: 'Prontuários',     desc: 'Registros médicos',           color: '#f59e0b', path: '/prontuarios'     },
    { icon: '⏳', label: 'Usuários Pendentes', desc: 'Aprovar novos usuários',      color: '#a78bfa', path: '/gestor/usuarios' },
  ]

  const cardsAdmin = [
    { icon: '🏨', label: 'Clínicas',  desc: 'Gerenciar clínicas',    color: '#38bdf8', path: '/admin/clinicas'  },
    { icon: '👤', label: 'Usuários', desc: 'Gerenciar usuários',    color: '#22c55e', path: '/admin/usuarios'  },
    { icon: '👥', label: 'Pacientes', desc: 'Ver todos pacientes',   color: '#f59e0b', path: '/pacientes'       },
    { icon: '📅', label: 'Consultas', desc: 'Ver todas consultas',   color: '#ef4444', path: '/consultas'       },
  ]

  const cards = perfil === 'admin' ? cardsAdmin : perfil === 'gestor' ? cardsGestor : cardsNormal

  const nomeExibido = user?.nome || user?.email?.split('@')[0] || 'Usuário'

  return (
    <PageLayout title='🏠 Início'>
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '1.3rem', margin: '0 0 6px' }}>
          Bem-vindo, {nomeExibido}! 👋
        </h3>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.92rem' }}>
          Sistema de gestão para clínicas médicas
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {cards.map(card => (
          <div
            key={card.path}
            onClick={() => navigate(card.path)}
            style={{
              background: '#1e293b',
              border: `1px solid #334155`,
              borderTop: `3px solid ${card.color}`,
              borderRadius: '10px',
              padding: '24px 20px',
              cursor: 'pointer',
              transition: 'transform 0.15s, background 0.15s',
              userSelect: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#273548'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>{card.icon}</div>
            <h4 style={{ color: '#f1f5f9', margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>
              {card.label}
            </h4>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.8rem' }}>{card.desc}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}
