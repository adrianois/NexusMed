import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase.js'
import { gerarToken } from '../lib/auth.js'

const router = Router()

// POST /auth/register
router.post('/register', async (req, res) => {
  const { nome, email, senha, perfil: pSol, clinica_id } = req.body
  if (!nome || !email || !senha)
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' })
  try {
    const { data: ex } = await supabase.from('usuarios').select('id').eq('email', email).limit(1)
    if (ex?.length > 0) return res.status(409).json({ error: 'E-mail já cadastrado.' })

    const senha_hash = await bcrypt.hash(senha, 10)
    const { data: todos } = await supabase.from('usuarios').select('id').limit(1)
    let perfil, status
    if (!todos || todos.length === 0) { perfil = 'admin'; status = 'ativo' }
    else { perfil = ['normal','gestor'].includes(pSol) ? pSol : 'normal'; status = 'pendente' }

    const ins = { nome, email, senha_hash, perfil, status }
    if (clinica_id) ins.clinica_id = clinica_id

    const { data, error } = await supabase.from('usuarios').insert([ins]).select()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: data[0] })
  } catch { res.status(500).json({ error: 'Erro interno.' }) }
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios.' })
  try {
    const { data: u } = await supabase.from('usuarios').select('*').eq('email', email).limit(1)
    if (!u?.length) return res.status(401).json({ error: 'Usuário não encontrado.' })
    const usr = u[0]
    if (usr.status === 'pendente') return res.status(403).json({ error: 'Conta aguardando aprovação.' })
    if (usr.status === 'inativo')  return res.status(403).json({ error: 'Conta desativada.' })
    if (!await bcrypt.compare(senha, usr.senha_hash)) return res.status(401).json({ error: 'Senha inválida.' })
    const token = gerarToken(usr)
    res.json({ token, perfil: usr.perfil, nome: usr.nome, clinica_id: usr.clinica_id })
  } catch { res.status(500).json({ error: 'Erro interno.' }) }
})

export default router
