import { NavLink, useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const ITEM = ({ to, icon, label }) => (
  <NavLink to={to} style={({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 14px', borderRadius: '8px', textDecoration: 'none',
    fontSize: '0.88rem', fontWeight: isActive ? 700 : 500,
    color: isActive ? '#f1f5f9' : '#64748b',
    background: isActive ? 'rgba(96,165,250,0.12)' : 'transparent',
    transition: 'all 0.15s',
  })}>
    <span>{icon}</span><span>{label}</span>
  </NavLink>
)

const SEP = ({ label }) => (
  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px 4px' }}>
    {label}
  </div>
)

export default function Sidebar({ onClose }) {
  const { usuario, logout } = useContext(AuthContext)
  const nav = useNavigate()
  const perfil = usuario?.perfil

  const handleLogout = () => { logout(); nav('/login') }

  return (
    <div style={{
      width: '220px', minHeight: '100vh',
      background: '#0a0f1e',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 10px',
    }}>
      {/* Logo */}
      <div style={{ padding: '8px 14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '10px' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.02em' }}>💊 NexusMed</div>
        {usuario && (
          <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '4px' }}>
            {usuario.nome} · <span style={{ color: '#3b82f6' }}>{perfil}</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>

        {/* ── Módulo Médico ──────────────────────────── */}
        {perfil === 'medico' && (
          <>
            <SEP label='Médico' />
            <ITEM to='/medico'           icon='🩺' label='Meu Painel'    />
            <ITEM to='/medico/agenda'    icon='📅' label='Minha Agenda'  />
            <ITEM to='/medico/triagem'   icon='🔔' label='Fila Triagem'  />
            <ITEM to='/medico/historico' icon='📁' label='Histórico'     />
            <ITEM to='/minha-senha'      icon='🔒' label='Minha Senha'   />
          </>
        )}

        {/* ── Perfil normal (recepção/atendente) ─────── */}
        {perfil === 'normal' && (
          <>
            <SEP label='Geral' />
            <ITEM to='/dashboard' icon='📊' label='Dashboard'  />
            <ITEM to='/pacientes' icon='👥' label='Pacientes'  />
            <ITEM to='/consultas' icon='📅' label='Consultas'  />
            <ITEM to='/medicos'   icon='👨‍⚕️' label='Médicos'   />
            <ITEM to='/triagem'   icon='🩺' label='Triagem'    />
          </>
        )}

        {/* ── Gestor ───────────────────────────────── */}
        {['gestor', 'admin'].includes(perfil) && perfil !== 'admin' && (
          <>
            <SEP label='Geral' />
            <ITEM to='/dashboard'   icon='📊' label='Dashboard'   />
            <ITEM to='/pacientes'   icon='👥' label='Pacientes'   />
            <ITEM to='/consultas'   icon='📅' label='Consultas'   />
            <ITEM to='/medicos'     icon='👨‍⚕️' label='Médicos'    />
            <ITEM to='/triagem'     icon='🩺' label='Triagem'     />
            <SEP label='Gestão' />
            <ITEM to='/gestor'          icon='📊' label='Painel Gestor'  />
            <ITEM to='/gestor/usuarios' icon='👤' label='Usuários'        />
            <ITEM to='/gestor/logs'     icon='📝' label='Logs'            />
          </>
        )}

        {/* ── Admin ────────────────────────────────── */}
        {perfil === 'admin' && (
          <>
            <SEP label='Geral' />
            <ITEM to='/dashboard'   icon='📊' label='Dashboard'   />
            <ITEM to='/pacientes'   icon='👥' label='Pacientes'   />
            <ITEM to='/consultas'   icon='📅' label='Consultas'   />
            <ITEM to='/medicos'     icon='👨‍⚕️' label='Médicos'    />
            <ITEM to='/triagem'     icon='🩺' label='Triagem'     />
            <SEP label='Gestão' />
            <ITEM to='/gestor'          icon='📊' label='Painel Gestor'  />
            <ITEM to='/gestor/usuarios' icon='👤' label='Usuários'        />
            <ITEM to='/gestor/logs'     icon='📝' label='Logs'            />
            <SEP label='Admin' />
            <ITEM to='/admin'          icon='⚙️' label='Painel Admin'  />
            <ITEM to='/admin/clinicas' icon='🏥' label='Clínicas'      />
            <ITEM to='/admin/usuarios' icon='👤' label='Usuários'      />
            <ITEM to='/logs'           icon='📝' label='Logs'          />
          </>
        )}

        {/* Minha Senha — todos exceto médico (médico já tem no bloco dele) */}
        {perfil !== 'medico' && (
          <ITEM to='/minha-senha' icon='🔒' label='Minha Senha' />
        )}

      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={{
        marginTop: '12px', width: '100%', padding: '9px',
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '8px', color: '#f87171', fontSize: '0.84rem',
        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s',
      }}>🚪 Sair</button>
    </div>
  )
}
