import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

// GET /usuarios  — lista usuarios conforme perfil
router.get('/', async (req, res) => {
  const { perfil, clinica_id, usuario_id } = req.usuario
  let q = supabase.from('usuarios').select('id,nome,email,perfil,status,clinica_id').order('nome')
  if (perfil === 'admin') {
    // admin ve todos
  } else if (perfil === 'gestor') {
    if (!clinica_id) return res.json([])
    q = q.eq('clinica_id', clinica_id)
  } else {
    // normal so ve a si mesmo
    q = q.eq('id', usuario_id)
  }
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// PATCH /usuarios/:id/senha
router.patch('/:id/senha', async (req, res) => {
  const { perfil, clinica_id, usuario_id } = req.usuario
  const alvoId = req.params.id
  const { senha_atual, nova_senha } = req.body

  if (!nova_senha || nova_senha.length < 6)
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' })

  // Buscar usuario alvo
  const { data: alvos, error: errBusca } = await supabase
    .from('usuarios').select('id,nome,email,senha_hash,clinica_id,perfil').eq('id', alvoId).limit(1)
  if (errBusca || !alvos?.length)
    return res.status(404).json({ error: 'Usuário não encontrado.' })
  const alvo = alvos[0]

  // Regras de acesso
  const ehProprioUsuario = usuario_id === alvoId
  const ehAdmin          = perfil === 'admin'
  const ehGestorDaClinica = perfil === 'gestor' && clinica_id && alvo.clinica_id === clinica_id

  if (!ehProprioUsuario && !ehAdmin && !ehGestorDaClinica)
    return res.status(403).json({ error: 'Você não tem permissão para alterar a senha deste usuário.' })

  // Se for o proprio usuario, exige senha atual
  if (ehProprioUsuario && !ehAdmin) {
    if (!senha_atual)
      return res.status(400).json({ error: 'Informe a senha atual para continuar.' })
    const senhaOk = await bcrypt.compare(senha_atual, alvo.senha_hash)
    if (!senhaOk)
      return res.status(401).json({ error: 'Senha atual incorreta.' })
  }

  const senha_hash = await bcrypt.hash(nova_senha, 10)
  const { error: errUpdate } = await supabase
    .from('usuarios').update({ senha_hash }).eq('id', alvoId)
  if (errUpdate) return res.status(500).json({ error: errUpdate.message })

  await registrarLog({
    usuario: req.usuario,
    acao: 'reset_senha',
    tabela: 'usuarios',
    registro_id: alvoId,
    detalhes: { alvo_nome: alvo.nome, alvo_email: alvo.email, por: perfil }
  })

  res.json({ message: `Senha de "${alvo.nome}" atualizada com sucesso.` })
})

export default router
