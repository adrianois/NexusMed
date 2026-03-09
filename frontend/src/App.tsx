import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login        from "./pages/Login"
import Register     from "./pages/Register"
import Dashboard    from "./pages/Dashboard"
import Pacientes    from "./pages/Pacientes"
import Consultas    from "./pages/Consultas"
import Prontuarios  from "./pages/Prontuarios"
import Clinicas     from "./pages/Clinicas"
import PrivateRoute from "./components/PrivateRoute"
import { AuthProvider } from "./context/AuthContext"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"         element={<Login />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/pacientes"   element={<PrivateRoute><Pacientes /></PrivateRoute>} />
          <Route path="/consultas"   element={<PrivateRoute><Consultas /></PrivateRoute>} />
          <Route path="/prontuarios" element={<PrivateRoute><Prontuarios /></PrivateRoute>} />
          <Route path="/clinicas"    element={<PrivateRoute><Clinicas /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}