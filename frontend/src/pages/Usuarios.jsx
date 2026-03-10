import { useEffect, useState } from 'react'
import api from '../api'
import PageLayout from '../components/PageLayout'
import ModalTrocarSenha from '../components/ModalTrocarSenha'
import { useAuth } from '../context/AuthContext'
import './InnerPage.css'

const PERFIL_CONFIG = {
  admin:  { bg:'#450a0a', color:'#fca5a5', label:'Admin'  },
  gestor: { bg:'#1c1917', color:'#fbbf24', label:'Gestor' },
  normal: { bg:'#1e293b', color:'#94a3b8', label:'Normal' },
}
const STATUS_CONFIG = {
  ativo:    { bg:'#14532d', color:'#86efac', label:'Ativo'    },
  pendente: { bg:'#78350f', color:'#fcd34d', label:'Pendente' },
  inativo:  { bg:'#1e293b', color:'#64748b', label:'Inativo'  },
}

export default function Usuarios() {
  const { user } = useAuth()
  const perfilLogado  = user?.perfil
  const idLogado      = user?.usuario_id

  const [usuarios, setUsuarios]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [erro, setErro]           = useState(null)
  const [modalSenhaId, setModalSenhaId] = useState(null)

  const carregar = () => {
    setLoading(true)
    api.get('/usuarios')
      .then(r => setUsuarios(r.data || []))
      .catch(() => setErro('Erro ao carregar usuários.'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const usuarioModal = usuarios.find(u => u.id === modalSenhaId)

  return (
    <PageLayout title='👥 Usuários'>

      {modalSenhaId && usuarioModal && (
        <ModalTrocarSenha
          usuarioAlvo={usuarioModal}
          perfilLogado={perfilLogado}
          usuarioLogadoId={idLogado}
          onFechar={() => setModalSenhaId(null)}
        />
      )}

      {loading && <p className='page-loading'>Carregando...</p>}
      {erro    && <p className='page-erro'>{erro}</p>}

      {!loading && !erro && (
        usuarios.length === 0
          ? <div className='page-vazio-box'><span className='page-vazio-icon'>👤</span><p>Nenhum usuário encontrado.</p></div>
          : (
            <div className='table-wrapper'>
              <table className='data-table'>
                <thead>
                  <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {usuarios.map(u => {
                    const pc = PERFIL_CONFIG[u.perfil]  || PERFIL_CONFIG.normal
                    const sc = STATUS_CONFIG[u.status]  || STATUS_CONFIG.inativo
                    const ehVoce = u.id === idLogado
                    return (
                      <tr key={u.id}>
                        <td style={{fontWeight:600}}>
                          {u.nome}
                          {ehVoce && <span style={{marginLeft:'6px',fontSize:'0.7rem',color:'#3b82f6',background:'#1e3a5f',padding:'1px 6px',borderRadius:'8px'}}>você</span>}
                        </td>
                        <td style={{color:'#94a3b8',fontSize:'0.85rem'}}>{u.email}</td>
                        <td><span style={{background:pc.bg,color:pc.color,padding:'3px 9px',borderRadius:'12px',fontSize:'0.72rem',fontWeight:700}}>{pc.label}</span></td>
                        <td><span style={{background:sc.bg,color:sc.color,padding:'3px 9px',borderRadius:'12px',fontSize:'0.72rem',fontWeight:700}}>{sc.label}</span></td>
                        <td>
                          <button className='btn' style={{fontSize:'0.72rem',padding:'4px 10px',background:'#1e3a5f',color:'#93c5fd',border:'1px solid #1d4ed8'}}
                            onClick={() => setModalSenhaId(u.id)}>
                            🔒 Trocar Senha
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
      )}
    </PageLayout>
  )
}
