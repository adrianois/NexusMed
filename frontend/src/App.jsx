import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'

import Login               from './pages/Login'
import Register            from './pages/Register'
import AguardandoAprovacao from './pages/AguardandoAprovacao'
import NaoAutorizado       from './pages/NaoAutorizado'
import EsqueciSenha        from './pages/EsqueciSenha'
import ResetarSenha        from './pages/ResetarSenha'
import ConfirmarConsulta   from './pages/ConfirmarConsulta'
import AgendamentoPublico  from './pages/AgendamentoPublico'

import Dashboard        from './pages/Dashboard'
import Pacientes        from './pages/Pacientes'
import Consultas        from './pages/Consultas'
import Medicos          from './pages/Medicos'
import MinhaSenha       from './pages/MinhaSenha'
import Logs             from './pages/Logs'
import Usuarios         from './pages/Usuarios'
import Triagem          from './pages/Triagem'
import Retornos         from './pages/Retornos'
import PosAtendimento   from './pages/PosAtendimento'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminClinicas  from './pages/admin/AdminClinicas'
import AdminUsuarios  from './pages/admin/AdminUsuarios'

import GestorDashboard   from './pages/gestor/GestorDashboard'
import GestorUsuarios    from './pages/gestor/GestorUsuarios'
import GestorTrocarSenha from './pages/gestor/GestorTrocarSenha'
import GestorLogs        from './pages/gestor/GestorLogs'

import MedicoDashboard   from './pages/medico/MedicoDashboard'
import MedicoAgenda      from './pages/medico/MedicoAgenda'
import MedicoTriagem     from './pages/medico/MedicoTriagem'
import MedicoAtendimento from './pages/medico/MedicoAtendimento'
import MedicoHistorico   from './pages/medico/MedicoHistorico'
import MedicoDocumentos  from './pages/medico/MedicoDocumentos'
import MedicoEvolucao    from './pages/medico/MedicoEvolucao'

const TODOS  = ['normal', 'gestor', 'admin', 'medico']
const MEDICO = ['medico', 'gestor', 'admin']
const GERAL  = ['normal', 'gestor', 'admin']

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path='/'                     element={<Login />} />
          <Route path='/login'                element={<Login />} />
          <Route path='/register'             element={<Register />} />
          <Route path='/aguardando-aprovacao' element={<AguardandoAprovacao />} />
          <Route path='/nao-autorizado'       element={<NaoAutorizado />} />
          <Route path='/esqueci-senha'        element={<EsqueciSenha />} />
          <Route path='/resetar-senha'        element={<ResetarSenha />} />
          <Route path='/confirmar-consulta'   element={<ConfirmarConsulta />} />
          <Route path='/agendar'              element={<AgendamentoPublico />} />

          {/* Geral */}
          <Route path='/dashboard'        element={<PrivateRoute perfis={GERAL}><Dashboard /></PrivateRoute>} />
          <Route path='/pacientes'        element={<PrivateRoute perfis={GERAL}><Pacientes /></PrivateRoute>} />
          <Route path='/consultas'        element={<PrivateRoute perfis={GERAL}><Consultas /></PrivateRoute>} />
          <Route path='/medicos'          element={<PrivateRoute perfis={GERAL}><Medicos /></PrivateRoute>} />
          <Route path='/minha-senha'      element={<PrivateRoute perfis={TODOS}><MinhaSenha /></PrivateRoute>} />
          <Route path='/triagem'          element={<PrivateRoute perfis={GERAL}><Triagem /></PrivateRoute>} />
          <Route path='/retornos'         element={<PrivateRoute perfis={GERAL}><Retornos /></PrivateRoute>} />
          <Route path='/pos-atendimento'  element={<PrivateRoute perfis={GERAL}><PosAtendimento /></PrivateRoute>} />

          {/* Admin */}
          <Route path='/admin'          element={<PrivateRoute perfis={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path='/admin/clinicas' element={<PrivateRoute perfis={['admin']}><AdminClinicas /></PrivateRoute>} />
          <Route path='/admin/usuarios' element={<PrivateRoute perfis={['admin']}><AdminUsuarios /></PrivateRoute>} />
          <Route path='/logs'           element={<PrivateRoute perfis={['admin']}><Logs /></PrivateRoute>} />
          <Route path='/usuarios'       element={<PrivateRoute perfis={['admin']}><Usuarios /></PrivateRoute>} />

          {/* Gestor */}
          <Route path='/gestor'              element={<PrivateRoute perfis={['gestor', 'admin']}><GestorDashboard /></PrivateRoute>} />
          <Route path='/gestor/usuarios'     element={<PrivateRoute perfis={['gestor', 'admin']}><GestorUsuarios /></PrivateRoute>} />
          <Route path='/gestor/trocar-senha' element={<PrivateRoute perfis={['gestor']}><GestorTrocarSenha /></PrivateRoute>} />
          <Route path='/gestor/logs'         element={<PrivateRoute perfis={['gestor', 'admin']}><GestorLogs /></PrivateRoute>} />

          {/* Médico */}
          <Route path='/medico'                          element={<PrivateRoute perfis={MEDICO}><MedicoDashboard /></PrivateRoute>} />
          <Route path='/medico/agenda'                   element={<PrivateRoute perfis={MEDICO}><MedicoAgenda /></PrivateRoute>} />
          <Route path='/medico/triagem'                  element={<PrivateRoute perfis={MEDICO}><MedicoTriagem /></PrivateRoute>} />
          <Route path='/medico/atendimento/:consulta_id' element={<PrivateRoute perfis={MEDICO}><MedicoAtendimento /></PrivateRoute>} />
          <Route path='/medico/historico'                element={<PrivateRoute perfis={MEDICO}><MedicoHistorico /></PrivateRoute>} />
          <Route path='/medico/documentos'               element={<PrivateRoute perfis={MEDICO}><MedicoDocumentos /></PrivateRoute>} />
          <Route path='/medico/evolucao'                 element={<PrivateRoute perfis={MEDICO}><MedicoEvolucao /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
