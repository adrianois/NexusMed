import { NavLink } from 'react-router-dom'
import './Sidebar.css'

export default function Sidebar() {
  return (
    <div className="sidebar">
      <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
        Pacientes
      </NavLink>
      <NavLink to="/consultas" className={({ isActive }) => isActive ? 'active' : ''}>
        Consultas
      </NavLink>
      <NavLink to="/prontuarios" className={({ isActive }) => isActive ? 'active' : ''}>
        Prontuários
      </NavLink>
      <NavLink to="/clinicas" className={({ isActive }) => isActive ? 'active' : ''}>
        Clínicas
      </NavLink>
    </div>
  )
}
