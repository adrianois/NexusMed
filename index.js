import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// Debug variáveis
console.log("DEBUG SUPABASE_URL:", process.env.SUPABASE_URL)
console.log("DEBUG SUPABASE_KEY:", process.env.SUPABASE_KEY ? "OK" : "MISSING")

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(bodyParser.json())

// Conexão Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const jwtSecret = process.env.JWT_SECRET || "segredo_super_seguro"

if (!supabaseUrl || !supabaseKey) {
  throw new Error("⚠️ SUPABASE_URL e SUPABASE_KEY não estão definidos no .env")
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ---------------------- Middleware ----------------------
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
  try {
    const { data, error } = await supabase.from('pacientes').select('id').limit(1)
    if (error) return res.status(500).json({ status: 'error', message: 'Falha ao conectar ao Supabase' })
    return res.json({ status: 'ok', message: 'API NexusMed conectada ao Supabase', supabase: data ? 'conectado' : 'sem dados' })
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Erro interno' })
  }
})

// ---------------------- Autenticação ----------------------
app.post('/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body
  const senha_hash = await bcrypt.hash(senha, 10)

  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, email, senha_hash }])
    .select()

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ usuario: data[0] })
})

app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .limit(1)

  if (!usuarios || usuarios.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' })

  const usuario = usuarios[0]
  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)
  if (!senhaValida) return res.status(401).json({ error: 'Senha inválida' })

  // Buscar clínicas vinculadas
  const { data: clinicas } = await supabase
    .from('usuarios_clinicas')
    .select('clinica_id')
    .eq('usuario_id', usuario.id)

  const token = jwt.sign(
    { usuario_id: usuario.id, clinicas: clinicas.map(c => c.clinica_id) },
    jwtSecret,
    { expiresIn: '8h' }
  )

  return res.json({ token })
})

// ---------------------- PACIENTES ----------------------
app.post('/pacientes', autenticar, async (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email, endereco } = req.body
  const { data, error } = await supabase
    .from('pacientes')
    .insert([{ nome, cpf, data_nascimento, telefone, email, endereco }])
    .select()

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ paciente: data[0] })
})

app.get('/pacientes', autenticar, async (req, res) => {
  const { data, error } = await supabase.from('pacientes').select('*')
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ pacientes: data || [] })
})

// ---------------------- CONSULTAS ----------------------
app.post('/consultas', autenticar, async (req, res) => {
  const { paciente_id, data_consulta, motivo, observacoes } = req.body
  const { data, error } = await supabase
    .from('consultas')
    .insert([{ paciente_id, data_consulta, motivo, observacoes }])
    .select()

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ consulta: data[0] })
})

app.get('/consultas', autenticar, async (req, res) => {
  const { data, error } = await supabase.from('consultas').select('*')
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ consultas: data || [] })
})

// ---------------------- PRONTUÁRIOS ----------------------
app.post('/prontuarios', autenticar, async (req, res) => {
  const { paciente_id, descricao, data_registro } = req.body
  const { data, error } = await supabase
    .from('prontuarios')
    .insert([{ paciente_id, descricao, data_registro }])
    .select()

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ prontuario: data[0] })
})

app.get('/prontuarios', autenticar, async (req, res) => {
  const { data, error } = await supabase.from('prontuarios').select('*')
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ prontuarios: data || [] })
})

// ---------------------- CLÍNICAS ----------------------
app.post('/clinicas', autenticar, async (req, res) => {
  const { nome, endereco, telefone } = req.body
  const { data, error } = await supabase
    .from('clinicas')
    .insert([{ nome, endereco, telefone }])
    .select()

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ clinica: data[0] })
})

app.get('/clinicas', autenticar, async (req, res) => {
  const { data, error } = await supabase.from('clinicas').select('*')
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ clinicas: data || [] })
})

// ---------------------- START SERVER ----------------------
app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`)
})
