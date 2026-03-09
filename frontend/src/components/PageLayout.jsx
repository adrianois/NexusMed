/**
 * PageLayout — Layout compartilhado para todas as páginas internas
 * Uso: <PageLayout title="Pacientes"> ...conteúdo... </PageLayout>
 */
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../pages/Dashboard.css"

const menuItems = [
  { icon: "🏠", label: "Início",      path: "/dashboard"   },
  { icon: "👥", label: "Pacientes",   path: "/pacientes"   },
  { icon: "📅", label: "Consultas",   path: "/consultas"   },
  { icon: "📋", label: "Prontuários", path: "/prontuarios" },
  { icon: "🏨", label: "Clínicas",    path: "/clinicas"    },
]

export default function PageLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const goto = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  return (
    <div className="dash-layout">

      {/* ── SIDEBAR ─────────────────────────── */}
      <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="dash-sidebar-logo">
          <span>🏥</span>
          <h1>NexusMed</h1>
        </div>

        <nav className="dash-sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.path}
              className={`dash-nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => goto(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user-info">
            <span className="user-avatar">👤</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="dash-logout-btn" onClick={logout}>🚪 Sair</button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── CONTEÚDO ────────────────────────── */}
      <div className="dash-content">
        <header className="dash-mobile-header">
          <button className="dash-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <span className="dash-mobile-title">🏥 {title || "NexusMed"}</span>
          <button className="dash-mobile-logout" onClick={logout}>🚪</button>
        </header>

        <main className="dash-main">
          <div className="page-header">
            <h2 className="page-title">{title}</h2>
          </div>
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile) ──────────────── */}
      <nav className="dash-bottom-nav">
        {menuItems.map(item => (
          <button
            key={item.path}
            className={`bottom-nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => goto(item.path)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}
