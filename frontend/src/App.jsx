import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"

export default function App() {
  const token = localStorage.getItem("token")

  return (
    <BrowserRouter>
      <Routes>
        {/* Tela inicial: Login */}
        <Route path="/" element={<Login />} />

        {/* Login e Registro */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard protegido */}
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Login />}
        />
      </Routes>
    </BrowserRouter>
  )
}
