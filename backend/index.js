import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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

// ---------------------- VINCULAR USUÁRIO A CLÍNICAS ----------------------
app.post('/usuarios_clinicas', autenticar, async (req, res) => {
  const { usuario_id, clinica_id } = req.body
  const { data, error } = await supabase
    .from('usuarios_clinicas')
    .insert([{ usuario_id, clinica_id }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ vinculo: data[0] })
})

// ---------------------- PACIENTES ----------------------
app.get('/pacientes', autenticar, async (req, res) => {
  const { data, error } = await supabase.from('pacientes').select('*')
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ pacientes: data || [] })
})

app.post('/pacientes', autenticar, async (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email, endereco } = req.body
  const { data, error } = await supabase
    .from('pacientes')
    .insert([{ nome, cpf, data_nascimento, telefone, email, endereco }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ paciente: data[0] })
})

app.put('/pacientes/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { nome, email, telefone } = req.body
  const { data, error } = await supabase
    .from('pacientes')
    .update({ nome, email, telefone })
    .eq('id', id)
    .select()
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ paciente: data[0] })
})

app.delete('/pacientes/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('pacientes').delete().eq('id', id)
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Paciente excluído com sucesso' })
})

// ---------------------- CONSULTAS ----------------------
app.get('/consultas', autenticar, async (req, res) => {
  const { data, error } = await supabase.from('consultas').select('*')
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ consultas: data || [] })
})

app.post('/consultas', autenticar, async (req, res) => {
  const { paciente_id, data_consulta, motivo, observacoes } = req.body
  const { data, error } = await supabase
    .from('consultas')
    .insert([{ paciente_id, data_consulta, motivo, observacoes }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ consulta: data[0] })
})

app.put('/consultas/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { motivo, observacoes } = req.body
  const { data, error } = await supabase
    .from('consultas')
    .update({ motivo, observacoes })
    .eq('id', id)
    .select()
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ consulta: data[0] })
})

app.delete('/consultas/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('consultas').delete().eq('id', id)
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Consulta excluída com sucesso' })
})

// ---------------------- PRONTUÁRIOS ----------------------
app.get('/prontuarios', autenticar, async (req, res) => {
  const { data, error } = await supabase.from('prontuarios').select('*')
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ prontuarios: data || [] })
})

app.post('/prontuarios', autenticar, async (req, res) => {
  const { paciente_id, descricao, data_registro } = req.body
  const { data, error } = await supabase
    .from('prontuarios')
    .insert([{ paciente_id, descricao, data_registro }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ prontuario: data[0] })
})

app.put('/prontuarios/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { descricao } = req.body
  const { data, error } = await supabase
    .from('prontuarios')
    .update({ descricao })
    .eq('id', id)
    .select()
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ prontuario: data[0] })
})

app.delete('/prontuarios/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('prontuarios').delete().eq('id', id)
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Prontuário excluído com sucesso' })
})

// ---------------------- CLÍNICAS ----------------------
app.get('/clinicas', autenticar, async (req, res) => {
  const { data, error } = await supabase.from('clinicas').select('*')
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ clinicas: data || [] })
})

app.post('/clinicas', autenticar, async (req, res) => {
  const { nome, endereco, telefone } = req.body
  const { data, error } = await supabase
    .from('clinicas')
    .insert([{ nome, endereco, telefone }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ clinica: data[0] })
})

app.put('/clinicas/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { nome, endereco, telefone } = req.body
  const { data, error } = await supabase
    .from('clinicas')
    .update({ nome, endereco, telefone })
    .eq('id', id)
    .select()
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ clinica: data[0] })
})

app.delete('/clinicas/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('clinicas').delete().eq('id', id)
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Clínica excluída com sucesso' })
})

// ---------------------- Inicialização ----------------------
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`)
})
