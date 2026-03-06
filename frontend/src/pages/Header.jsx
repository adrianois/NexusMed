import { useNavigate } from 'react-router-dom'
import './Header.css'

export default function Header() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="header">
      <h1>NexusMed</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
