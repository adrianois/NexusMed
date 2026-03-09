import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app = express()
const port = process.env.PORT || 4000

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(bodyParser.json())

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const jwtSecret = process.env.JWT_SECRET || 'segredo_super_seguro'

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// ---------------------- MIDDLEWARES ----------------------
function autenticar(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.sendStatus(401)
  jwt.verify(token, jwtSecret, (err, payload) => {
    if (err) return res.sendStatus(403)
    req.usuario = payload
    next()
  })
}

function apenasAdmin(req, res, next) {
  if (req.usuario?.perfil !== 'admin') return res.status(403).json({ error: 'Acesso restrito ao administrador.' })
  next()
}

function apenasGestor(req, res, next) {
  if (!['admin', 'gestor'].includes(req.usuario?.perfil)) return res.status(403).json({ error: 'Acesso restrito ao gestor.' })
  next()
}

// ---------------------- HEALTH ----------------------
app.get('/', (req, res) => res.send('🚀 API NexusMed está rodando!'))

app.get('/health', async (req, res) => {
  try {
    const { error } = await supabase.from('pacientes').select('id').limit(1)
    if (error) return res.status(500).json({ status: 'error' })
    return res.json({ status: 'ok' })
  } catch { return res.status(500).json({ status: 'error' }) }
})

// ---------------------- AUTH ----------------------
app.post('/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body
  if (!nome || !email || !senha) return res.status(400).json({ error: 'Campos obrigatórios ausentes.' })
  try {
    const { data: existente } = await supabase.from('usuarios').select('id').eq('email', email).limit(1)
    if (existente?.length > 0) return res.status(409).json({ error: 'E-mail já cadastrado.' })
    const senha_hash = await bcrypt.hash(senha, 10)
    // Verifica se é o primeiro usuário (será admin)
    const { data: todos } = await supabase.from('usuarios').select('id').limit(1)
    const perfil = (!todos || todos.length === 0) ? 'admin' : 'normal'
    const status = perfil === 'admin' ? 'ativo' : 'pendente'
    const { data, error } = await supabase.from('usuarios').insert([{ nome, email, senha_hash, perfil, status }]).select()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ message: 'Usuário criado!', usuario: data[0] })
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' })
  }
})

app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body
  try {
    const { data: usuarios } = await supabase.from('usuarios').select('*').eq('email', email).limit(1)
    if (!usuarios?.length) return res.status(401).json({ error: 'Usuário não encontrado.' })
    const usuario = usuarios[0]
    if (usuario.status === 'pendente') return res.status(403).json({ error: 'Conta aguardando aprovação.' })
    if (usuario.status === 'inativo') return res.status(403).json({ error: 'Conta desativada. Contate o administrador.' })
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)
    if (!senhaValida) return res.status(401).json({ error: 'Senha inválida.' })
    const token = jwt.sign(
      { usuario_id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, clinica_id: usuario.clinica_id, status: usuario.status },
      jwtSecret,
      { expiresIn: '8h' }
    )
    return res.json({ token, perfil: usuario.perfil, nome: usuario.nome, clinica_id: usuario.clinica_id })
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' })
  }
})

// ---------------------- ADMIN — CLÍNICAS ----------------------
app.get('/admin/clinicas', autenticar, apenasAdmin, async (req, res) => {
  const { data, error } = await supabase.from('clinicas').select('*').order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/admin/clinicas', autenticar, apenasAdmin, async (req, res) => {
  const { nome, cnpj, endereco, telefone } = req.body
  if (!nome || !cnpj) return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' })
  const { data, error } = await supabase.from('clinicas').insert([{ nome, cnpj, endereco, telefone, ativo: true }]).select()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data[0])
})

app.patch('/admin/clinicas/:id/status', autenticar, apenasAdmin, async (req, res) => {
  const { id } = req.params
  const { ativo } = req.body
  const { data, error } = await supabase.from('clinicas').update({ ativo }).eq('id', id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

// ---------------------- ADMIN — USUÁRIOS ----------------------
app.get('/admin/usuarios', autenticar, apenasAdmin, async (req, res) => {
  const { data, error } = await supabase.from('usuarios').select('id, nome, email, perfil, status, clinica_id').order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.patch('/admin/usuarios/:id', autenticar, apenasAdmin, async (req, res) => {
  const { id } = req.params
  const { perfil, status, clinica_id } = req.body
  const updates = {}
  if (perfil) updates.perfil = perfil
  if (status) updates.status = status
  if (clinica_id !== undefined) updates.clinica_id = clinica_id
  const { data, error } = await supabase.from('usuarios').update(updates).eq('id', id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

// ---------------------- GESTOR — USUÁRIOS PENDENTES ----------------------
app.get('/gestor/usuarios/pendentes', autenticar, apenasGestor, async (req, res) => {
  const clinica_id = req.usuario.clinica_id
  if (!clinica_id) return res.status(400).json({ error: 'Gestor sem clínica vinculada.' })
  const { data, error } = await supabase.from('usuarios').select('id, nome, email, perfil, status').eq('clinica_id', clinica_id).eq('status', 'pendente')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.patch('/gestor/usuarios/:id/aprovar', autenticar, apenasGestor, async (req, res) => {
  const { id } = req.params
  const { aprovado } = req.body
  const status = aprovado ? 'ativo' : 'inativo'
  const { data, error } = await supabase.from('usuarios').update({ status }).eq('id', id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

// ---------------------- PACIENTES ----------------------
app.get('/pacientes', autenticar, async (req, res) => {
  const clinica_id = req.usuario.clinica_id
  const query = supabase.from('pacientes').select('*')
  if (req.usuario.perfil !== 'admin') query.eq('clinica_id', clinica_id)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/pacientes', autenticar, async (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email } = req.body
  const clinica_id = req.usuario.clinica_id
  try {
    const { data, error } = await supabase.from('pacientes').insert([{ nome, cpf, data_nascimento, telefone, email, clinica_id }]).select()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/pacientes/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase.from('pacientes').update(req.body).eq('id', id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

app.delete('/pacientes/:id', autenticar, async (req, res) => {
  const { error } = await supabase.from('pacientes').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Paciente removido.' })
})

// ---------------------- CONSULTAS ----------------------
app.get('/consultas', autenticar, async (req, res) => {
  const query = supabase.from('consultas').select('*')
  if (req.usuario.perfil !== 'admin') query.eq('clinica_id', req.usuario.clinica_id)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/consultas', autenticar, async (req, res) => {
  const { paciente_id, data_consulta, horario, motivo, observacoes } = req.body
  const clinica_id = req.usuario.clinica_id
  const { data, error } = await supabase.from('consultas').insert([{ paciente_id, data_consulta, horario, motivo, observacoes, clinica_id }]).select()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data[0])
})

// ---------------------- PRONTUÁRIOS ----------------------
app.get('/prontuarios', autenticar, async (req, res) => {
  const query = supabase.from('prontuarios').select('*')
  if (req.usuario.perfil !== 'admin') query.eq('clinica_id', req.usuario.clinica_id)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/prontuarios', autenticar, async (req, res) => {
  const { paciente_id, descricao, data_registro } = req.body
  const clinica_id = req.usuario.clinica_id
  const { data, error } = await supabase.from('prontuarios').insert([{ paciente_id, descricao, data_registro, clinica_id }]).select()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data[0])
})

// ---------------------- CLÍNICAS (leitura geral) ----------------------
app.get('/clinicas', autenticar, async (req, res) => {
  const { data, error } = await supabase.from('clinicas').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/clinicas', autenticar, apenasAdmin, async (req, res) => {
  const { nome, cnpj, endereco, telefone } = req.body
  const { data, error } = await supabase.from('clinicas').insert([{ nome, cnpj, endereco, telefone, ativo: true }]).select()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data[0])
})

app.listen(port, () => console.log(`🚀 Servidor rodando na porta ${port}`))
