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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(bodyParser.json())

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const jwtSecret = process.env.JWT_SECRET || "segredo_super_seguro"

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ SUPABASE_URL e SUPABASE_KEY não estão definidos no .env")
  console.error("O servidor vai subir, mas as rotas do banco vão falhar.")
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

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
app.post('/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Campos nome, email e senha são obrigatórios.' })
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Banco de dados não configurado no servidor.' })
  }

  try {
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

    const senha_hash = await bcrypt.hash(senha, 10)

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

// ---------------------- PACIENTES ----------------------
app.get("/pacientes", autenticar, async (req, res) => {
  try {
    const { data, error } = await supabase.from("pacientes").select("*")
    if (error) {
      console.error('Erro ao buscar pacientes:', error)
      return res.status(500).json({ error: error.message || "Erro ao carregar pacientes." })
    }
    res.json(data)
  } catch (err) {
    console.error('Erro inesperado ao buscar pacientes:', err)
    res.status(500).json({ error: "Erro ao carregar pacientes." })
  }
})

app.post("/pacientes", autenticar, async (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email } = req.body

  console.log('📄 Dados recebidos:', { nome, cpf, data_nascimento, telefone, email })

  try {
    const { data, error } = await supabase
      .from("pacientes")
      .insert([{ nome, cpf, data_nascimento, telefone, email }])
      .select()

    if (error) {
      console.error('❌ Erro Supabase ao criar paciente:', error)
      return res.status(400).json({ error: error.message || "Erro ao criar paciente." })
    }

    console.log('✅ Paciente criado:', data[0])
    res.status(201).json(data[0])
  } catch (err) {
    console.error('❌ Erro inesperado ao criar paciente:', err)
    res.status(500).json({ error: err.message || "Erro ao criar paciente." })
  }
})

app.put("/pacientes/:id", autenticar, async (req, res) => {
  const { id } = req.params
  try {
    const { data, error } = await supabase
      .from("pacientes")
      .update(req.body)
      .eq("id", id)
      .select()
    if (error) {
      console.error('Erro ao atualizar paciente:', error)
      return res.status(400).json({ error: error.message || "Erro ao atualizar paciente." })
    }
    res.json(data[0])
  } catch (err) {
    console.error('Erro inesperado ao atualizar paciente:', err)
    res.status(500).json({ error: "Erro ao atualizar paciente." })
  }
})

app.delete("/pacientes/:id", autenticar, async (req, res) => {
  const { id } = req.params
  try {
    const { error } = await supabase.from("pacientes").delete().eq("id", id)
    if (error) {
      console.error('Erro ao remover paciente:', error)
      return res.status(400).json({ error: error.message || "Erro ao remover paciente." })
    }
    res.json({ message: "Paciente removido com sucesso." })
  } catch (err) {
    console.error('Erro inesperado ao remover paciente:', err)
    res.status(500).json({ error: "Erro ao remover paciente." })
  }
})

// ---------------------- CONSULTAS ----------------------
app.get("/consultas", autenticar, async (req, res) => {
  try {
    const { data, error } = await supabase.from("consultas").select("*")
    if (error) {
      console.error('Erro ao buscar consultas:', error)
      return res.status(500).json({ error: error.message || "Erro ao carregar consultas." })
    }
    res.json(data)
  } catch (err) {
    console.error('Erro inesperado ao buscar consultas:', err)
    res.status(500).json({ error: "Erro ao carregar consultas." })
  }
})

app.post("/consultas", autenticar, async (req, res) => {
  const { paciente_id, data_consulta, horario, motivo, observacoes } = req.body
  try {
    const { data, error } = await supabase
      .from("consultas")
      .insert([{ paciente_id, data_consulta, horario, motivo, observacoes }])
      .select()
    if (error) {
      console.error('Erro ao criar consulta:', error)
      return res.status(400).json({ error: error.message || "Erro ao criar consulta." })
    }
    res.status(201).json(data[0])
  } catch (err) {
    console.error('Erro inesperado ao criar consulta:', err)
    res.status(500).json({ error: "Erro ao criar consulta." })
  }
})

// ---------------------- PRONTUÁRIOS ----------------------
app.get("/prontuarios", autenticar, async (req, res) => {
  try {
    const { data, error } = await supabase.from("prontuarios").select("*")
    if (error) {
      console.error('Erro ao buscar prontuários:', error)
      return res.status(500).json({ error: error.message || "Erro ao carregar prontuários." })
    }
    res.json(data)
  } catch (err) {
    console.error('Erro inesperado ao buscar prontuários:', err)
    res.status(500).json({ error: "Erro ao carregar prontuários." })
  }
})

app.post("/prontuarios", autenticar, async (req, res) => {
  const { paciente_id, descricao, data_registro } = req.body
  try {
    const { data, error } = await supabase
      .from("prontuarios")
      .insert([{ paciente_id, descricao, data_registro }])
      .select()
    if (error) {
      console.error('Erro ao criar prontuário:', error)
      return res.status(400).json({ error: error.message || "Erro ao criar prontuário." })
    }
    res.status(201).json(data[0])
  } catch (err) {
    console.error('Erro inesperado ao criar prontuário:', err)
    res.status(500).json({ error: "Erro ao criar prontuário." })
  }
})

// ---------------------- CLÍNICAS ----------------------
app.get("/clinicas", autenticar, async (req, res) => {
  try {
    const { data, error } = await supabase.from("clinicas").select("*")
    if (error) {
      console.error('Erro ao buscar clínicas:', error)
      return res.status(500).json({ error: error.message || "Erro ao carregar clínicas." })
    }
    res.json(data)
  } catch (err) {
    console.error('Erro inesperado ao buscar clínicas:', err)
    res.status(500).json({ error: "Erro ao carregar clínicas." })
  }
})

app.post("/clinicas", autenticar, async (req, res) => {
  const { nome, cnpj, endereco, telefone } = req.body
  try {
    const { data, error } = await supabase
      .from("clinicas")
      .insert([{ nome, cnpj, endereco, telefone }])
      .select()
    if (error) {
      console.error('Erro ao criar clínica:', error)
      return res.status(400).json({ error: error.message || "Erro ao criar clínica." })
    }
    res.status(201).json(data[0])
  } catch (err) {
    console.error('Erro inesperado ao criar clínica:', err)
    res.status(500).json({ error: "Erro ao criar clínica." })
  }
})

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`)
})
