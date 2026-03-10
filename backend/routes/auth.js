import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { supabase } from '../lib/supabase.js'
import { gerarToken } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'
import { enviarEmailResetSenha } from '../lib/mailer.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { nome, email, senha, perfil: pSol, clinica_id } = req.body
  if (!nome || !email || !senha)
    return res.status(400).json({ error: 'Nome, email e senha s\u00e3o obrigat\u00f3rios.' })
  try {
    const { data: ex } = await supabase.from('usuarios').select('id').eq('email', email).limit(1)
    if (ex?.length > 0) return res.status(409).json({ error: 'E-mail j\u00e1 cadastrado.' })
    const senha_hash = await bcrypt.hash(senha, 10)
    const { data: todos } = await supabase.from('usuarios').select('id').limit(1)
    let perfil, status
    if (!todos || todos.length === 0) { perfil = 'admin'; status = 'ativo' }
    else { perfil = ['normal','gestor'].includes(pSol) ? pSol : 'normal'; status = 'pendente' }
    const ins = { nome, email, senha_hash, perfil, status }
    if (clinica_id) ins.clinica_id = clinica_id
    const { data, error } = await supabase.from('usuarios').insert([ins]).select()
    if (error) return res.status(400).json({ error: error.message })
    await registrarLog({ usuario: { nome, perfil, clinica_id }, acao: 'register', tabela: 'usuarios', registro_id: data[0].id, detalhes: { email, perfil, status } })
    res.status(201).json({ message: 'Usu\u00e1rio criado com sucesso!', usuario: data[0] })
  } catch { res.status(500).json({ error: 'Erro interno.' }) }
})

router.post('/login', async (req, res) => {
  const { email, senha } = req.body
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigat\u00f3rios.' })
  try {
    const { data: u } = await supabase.from('usuarios').select('*').eq('email', email).limit(1)
    if (!u?.length) return res.status(401).json({ error: 'Usu\u00e1rio n\u00e3o encontrado.' })
    const usr = u[0]
    if (usr.status === 'pendente') return res.status(403).json({ error: 'Conta aguardando aprova\u00e7\u00e3o.' })
    if (usr.status === 'inativo')  return res.status(403).json({ error: 'Conta desativada.' })
    if (!await bcrypt.compare(senha, usr.senha_hash)) {
      await registrarLog({ usuario: { nome: usr.nome, perfil: usr.perfil, usuario_id: usr.id, clinica_id: usr.clinica_id }, acao: 'login_falhou', tabela: 'usuarios', registro_id: usr.id })
      return res.status(401).json({ error: 'Senha inv\u00e1lida.' })
    }
    const token = gerarToken(usr)
    await registrarLog({ usuario: { usuario_id: usr.id, nome: usr.nome, perfil: usr.perfil, clinica_id: usr.clinica_id }, acao: 'login', tabela: 'usuarios', registro_id: usr.id })
    res.json({ token, perfil: usr.perfil, nome: usr.nome, clinica_id: usr.clinica_id })
  } catch { res.status(500).json({ error: 'Erro interno.' }) }
})

// POST /auth/esqueci-senha
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'E-mail obrigat\u00f3rio.' })
  try {
    const { data: u } = await supabase.from('usuarios').select('id,nome,email,status').eq('email', email).limit(1)
    // Resposta gen\u00e9rica por seguran\u00e7a (n\u00e3o revela se e-mail existe)
    if (!u?.length || u[0].status === 'inativo') {
      return res.json({ message: 'Se o e-mail estiver cadastrado, voc\u00ea receberá as instru\u00e7\u00f5es em breve.' })
    }
    const usr = u[0]
    const token      = crypto.randomBytes(32).toString('hex')
    const expira_em  = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hora

    // Salva token na tabela reset_senha (cria se n\u00e3o existir)
    await supabase.from('reset_senha').upsert([
      { usuario_id: usr.id, token, expira_em, usado: false }
    ], { onConflict: 'usuario_id' })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

    try {
      await enviarEmailResetSenha({ para: usr.email, nome: usr.nome, token, frontendUrl })
    } catch (mailErr) {
      console.error('Erro ao enviar email:', mailErr.message)
      // N\u00e3o retorna erro ao cliente para n\u00e3o expor config de email
    }

    await registrarLog({ usuario: { nome: usr.nome, perfil: 'n/a', usuario_id: usr.id }, acao: 'esqueci_senha', tabela: 'usuarios', registro_id: usr.id })
    res.json({ message: 'Se o e-mail estiver cadastrado, voc\u00ea receberá as instru\u00e7\u00f5es em breve.' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// POST /auth/resetar-senha
router.post('/resetar-senha', async (req, res) => {
  const { token, nova_senha } = req.body
  if (!token || !nova_senha) return res.status(400).json({ error: 'Token e nova senha s\u00e3o obrigat\u00f3rios.' })
  if (nova_senha.length < 6)  return res.status(400).json({ error: 'A senha deve ter no m\u00ednimo 6 caracteres.' })
  try {
    const { data: registros } = await supabase
      .from('reset_senha')
      .select('*')
      .eq('token', token)
      .eq('usado', false)
      .limit(1)

    if (!registros?.length)
      return res.status(400).json({ error: 'Token inv\u00e1lido ou já utilizado.' })

    const reg = registros[0]
    if (new Date(reg.expira_em) < new Date())
      return res.status(400).json({ error: 'Token expirado. Solicite um novo link.' })

    const senha_hash = await bcrypt.hash(nova_senha, 10)
    await supabase.from('usuarios').update({ senha_hash }).eq('id', reg.usuario_id)
    await supabase.from('reset_senha').update({ usado: true }).eq('token', token)

    await registrarLog({ usuario: { usuario_id: reg.usuario_id, nome: 'n/a', perfil: 'n/a' }, acao: 'resetar_senha', tabela: 'usuarios', registro_id: reg.usuario_id })
    res.json({ message: 'Senha redefinida com sucesso! Fa\u00e7a login.' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

export default router
