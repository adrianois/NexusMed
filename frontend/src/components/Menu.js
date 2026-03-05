import React from 'react'
import { Link } from 'react-router-dom'
import '../App.css'   // ajuste o caminho se o CSS estiver em outra pasta

function Menu() {
  return (
    <nav className="menu">
      <h2>NexusMed</h2>
      <ul>
        <li><Link to="/pacientes">Pacientes</Link></li>
        <li><Link to="/consultas">Consultas</Link></li>
        <li><Link to="/prontuarios">Prontuários</Link></li>
        <li><Link to="/clinicas">Clínicas</Link></li>
      </ul>
    </nav>
  )
}

export default Menu
