import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { createClient } from '@supabase/supabase-js'
// ✅ CORREÇÃO 1: Trocar 'bcrypt' por 'bcryptjs' (puro JS, sem compilação nativa)
// No terminal: npm uninstall bcrypt && npm install bcryptjs
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app = express()
const port = process.env.PORT || 4000

// ✅ CORREÇÃO 2: CORS explícito para aceitar qualquer origem (ajuste em produção)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(bodyParser.json())

// Conexão Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const jwtSecret = process.env.JWT_SECRET || "segredo_super_seguro"

// ✅ CORREÇÃO 3: Não lançar erro fatal — logar e deixar servidor subir
// (antes: throw new Error(...) derrubava o processo inteiro)
if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ SUPABASE_URL e SUPABASE_KEY não estão definidos no .env")
  console.error("O servidor vai subir, mas as rotas do banco vão falhar.")
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ---------------------- Middleware de autenticação ----------------------
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.sendStatus(401)

  jwt.verify(token, jwtSecret, (err, usuario) => {
    if (err) return res.sendStatus(403)
    req.usuario = usuario
    next()
  })
}

// ---------------------- Rotas iniciais ----------------------
app.get('/', (req, res) => {
  res.send('🚀 API NexusMed está rodando!')
})

app.get('/health', async (req, res) => {
  if (!supabase) return res.status(500).json({ status: 'error', message: 'Supabase não configurado' })
  try {
    const { data, error } = await supabase.from('pacientes').select('id').limit(1)
    if (error) return res.status(500).json({ status: 'error', message: 'Falha ao conectar ao Supabase' })
    return res.json({ status: 'ok', message: 'API NexusMed conectada ao Supabase' })
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Erro interno' })
  }
})

// ---------------------- Autenticação ----------------------

// ✅ REGISTRO
app.post('/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Campos nome, email e senha são obrigatórios.' })
  }

  // ✅ CORREÇÃO 4: Verificar se supabase foi inicializado antes de usar
  if (!supabase) {
    return res.status(500).json({ error: 'Banco de dados não configurado no servidor.' })
  }

  try {
    // Verifica se e-mail já existe
    const { data: existente, error: erroBusca } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (erroBusca) {
      console.error('Erro ao buscar usuário:', erroBusca)
      return res.status(500).json({ error: erroBusca.message })
    }

    if (existente && existente.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' })
    }

    // Gera hash da senha com bcryptjs
    const senha_hash = await bcrypt.hash(senha, 10)

    // Insere no Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nome, email, senha_hash }])
      .select()

    if (error) {
      console.error('Erro ao inserir usuário:', error)
      return res.status(400).json({ error: error.message })
    }

    return res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: data[0] })
  } catch (err) {
    console.error('Erro inesperado no registro:', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
})

// ✅ LOGIN
app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body

  if (!supabase) {
    return res.status(500).json({ error: 'Banco de dados não configurado no servidor.' })
  }

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .limit(1)

  if (!usuarios || usuarios.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' })

  const usuario = usuarios[0]
  // ✅ bcryptjs.compare funciona igual ao bcrypt
  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)
  if (!senhaValida) return res.status(401).json({ error: 'Senha inválida' })

  const { data: clinicas } = await supabase
    .from('usuarios_clinicas')
    .select('clinica_id')
    .eq('usuario_id', usuario.id)

  const token = jwt.sign(
    { usuario_id: usuario.id, clinicas: (clinicas || []).map(c => c.clinica_id) },
    jwtSecret,
    { expiresIn: '8h' }
  )

  return res.json({ token })
})

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`)
})
