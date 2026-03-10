import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

export default function Sidebar() {
  const { user } = useAuth()
  const perfil = user?.perfil

  return (
    <div className='sidebar'>

      {/* Links comuns a todos */}
      <NavLink to='/dashboard'   className={({ isActive }) => isActive ? 'active' : ''}>🏠 Dashboard</NavLink>
      <NavLink to='/pacientes'   className={({ isActive }) => isActive ? 'active' : ''}>👥 Pacientes</NavLink>
      <NavLink to='/consultas'   className={({ isActive }) => isActive ? 'active' : ''}>📅 Consultas</NavLink>
      <NavLink to='/prontuarios' className={({ isActive }) => isActive ? 'active' : ''}>📋 Prontuários</NavLink>
      <NavLink to='/medicos'     className={({ isActive }) => isActive ? 'active' : ''}>👨‍⚕️ Médicos</NavLink>

      {/* Gestor */}
      {(perfil === 'gestor') && (
        <>
          <NavLink to='/gestor'              className={({ isActive }) => isActive ? 'active' : ''}>📊 Painel Gestor</NavLink>
          <NavLink to='/gestor/usuarios'     className={({ isActive }) => isActive ? 'active' : ''}>✅ Aprovar Usuários</NavLink>
          <NavLink to='/clinicas'            className={({ isActive }) => isActive ? 'active' : ''}>🏥 Clínicas</NavLink>
          <NavLink to='/gestor/trocar-senha' className={({ isActive }) => isActive ? 'active' : ''}>🔑 Gerenciar Senhas</NavLink>
        </>
      )}

      {/* Admin */}
      {perfil === 'admin' && (
        <>
          <NavLink to='/admin'          className={({ isActive }) => isActive ? 'active' : ''}>⚙️ Painel Admin</NavLink>
          <NavLink to='/admin/clinicas' className={({ isActive }) => isActive ? 'active' : ''}>🏥 Clínicas</NavLink>
          <NavLink to='/admin/usuarios' className={({ isActive }) => isActive ? 'active' : ''}>👤 Usuários</NavLink>
          <NavLink to='/logs'           className={({ isActive }) => isActive ? 'active' : ''}>📝 Logs</NavLink>
        </>
      )}

      {/* Todos: minha senha */}
      <NavLink to='/minha-senha' className={({ isActive }) => isActive ? 'active' : ''}>🔐 Minha Senha</NavLink>

    </div>
  )
}
