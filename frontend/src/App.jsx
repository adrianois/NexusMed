import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'

import Login               from './pages/Login'
import Register            from './pages/Register'
import AguardandoAprovacao from './pages/AguardandoAprovacao'
import NaoAutorizado       from './pages/NaoAutorizado'
import EsqueciSenha        from './pages/EsqueciSenha'
import ResetarSenha        from './pages/ResetarSenha'

import Dashboard   from './pages/Dashboard'
import Pacientes   from './pages/Pacientes'
import Consultas   from './pages/Consultas'
import Prontuarios from './pages/Prontuarios'
import Medicos     from './pages/Medicos'
import MinhaSenha  from './pages/MinhaSenha'
import Logs        from './pages/Logs'
import Usuarios    from './pages/Usuarios'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminClinicas  from './pages/admin/AdminClinicas'
import AdminUsuarios  from './pages/admin/AdminUsuarios'

import GestorDashboard   from './pages/gestor/GestorDashboard'
import GestorUsuarios    from './pages/gestor/GestorUsuarios'
import GestorTrocarSenha from './pages/gestor/GestorTrocarSenha'
import GestorLogs        from './pages/gestor/GestorLogs'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* P\u00fablicas */}
          <Route path='/'                     element={<Login />} />
          <Route path='/login'                element={<Login />} />
          <Route path='/register'             element={<Register />} />
          <Route path='/aguardando-aprovacao' element={<AguardandoAprovacao />} />
          <Route path='/nao-autorizado'       element={<NaoAutorizado />} />
          <Route path='/esqueci-senha'        element={<EsqueciSenha />} />
          <Route path='/resetar-senha'        element={<ResetarSenha />} />

          {/* Todos os perfis autenticados */}
          <Route path='/dashboard'    element={<PrivateRoute perfis={['normal','gestor','admin']}><Dashboard /></PrivateRoute>} />
          <Route path='/pacientes'    element={<PrivateRoute perfis={['normal','gestor','admin']}><Pacientes /></PrivateRoute>} />
          <Route path='/consultas'    element={<PrivateRoute perfis={['normal','gestor','admin']}><Consultas /></PrivateRoute>} />
          <Route path='/prontuarios'  element={<PrivateRoute perfis={['normal','gestor','admin']}><Prontuarios /></PrivateRoute>} />
          <Route path='/medicos'      element={<PrivateRoute perfis={['normal','gestor','admin']}><Medicos /></PrivateRoute>} />
          <Route path='/minha-senha'  element={<PrivateRoute perfis={['normal','gestor','admin']}><MinhaSenha /></PrivateRoute>} />

          {/* Cl\u00ednicas */}
          <Route path='/clinicas' element={<PrivateRoute perfis={['admin','gestor']}><AdminClinicas /></PrivateRoute>} />

          {/* Admin */}
          <Route path='/admin'          element={<PrivateRoute perfis={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path='/admin/clinicas' element={<PrivateRoute perfis={['admin']}><AdminClinicas /></PrivateRoute>} />
          <Route path='/admin/usuarios' element={<PrivateRoute perfis={['admin']}><AdminUsuarios /></PrivateRoute>} />
          <Route path='/logs'           element={<PrivateRoute perfis={['admin']}><Logs /></PrivateRoute>} />
          <Route path='/usuarios'       element={<PrivateRoute perfis={['admin']}><Usuarios /></PrivateRoute>} />

          {/* Gestor */}
          <Route path='/gestor'               element={<PrivateRoute perfis={['gestor','admin']}><GestorDashboard /></PrivateRoute>} />
          <Route path='/gestor/usuarios'      element={<PrivateRoute perfis={['gestor','admin']}><GestorUsuarios /></PrivateRoute>} />
          <Route path='/gestor/trocar-senha'  element={<PrivateRoute perfis={['gestor']}><GestorTrocarSenha /></PrivateRoute>} />
          <Route path='/gestor/logs'          element={<PrivateRoute perfis={['gestor','admin']}><GestorLogs /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
