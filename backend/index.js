import 'dotenv/config'   // garante que o .env seja carregado
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { createClient } from '@supabase/supabase-js'

const app = express()
const port = process.env.PORT || 4000

// Configurações globais
app.use(cors())
app.use(bodyParser.json())

// Conexão com Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("⚠️ SUPABASE_URL e SUPABASE_KEY não estão definidos no .env")
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ---------------------- PACIENTES ----------------------
app.post('/pacientes', async (req, res) => {
  try {
    const { nome, cpf, data_nascimento, telefone, email, endereco } = req.body

    const { data, error } = await supabase
      .from('pacientes')
      .insert([{ nome, cpf, data_nascimento, telefone, email, endereco }])
      .select()

    if (error) return res.status(400).json({ error: error.message })
    if (!data || data.length === 0) return res.status(500).json({ error: 'Falha ao inserir paciente' })

    return res.status(201).json({ paciente: data[0] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro no servidor' })
  }
})

app.get('/pacientes', async (req, res) => {
  try {
    const { data, error } = await supabase.from('pacientes').select('*')
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ pacientes: data || [] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro no servidor' })
  }
})

// ---------------------- CONSULTAS ----------------------
app.post('/consultas', async (req, res) => {
  try {
    const { paciente_id, data_consulta, motivo, observacoes } = req.body

    const { data, error } = await supabase
      .from('consultas')
      .insert([{ paciente_id, data_consulta, motivo, observacoes }])
      .select()

    if (error) return res.status(400).json({ error: error.message })
    if (!data || data.length === 0) return res.status(500).json({ error: 'Falha ao inserir consulta' })

    return res.status(201).json({ consulta: data[0] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro no servidor' })
  }
})

app.get('/consultas', async (req, res) => {
  try {
    const { data, error } = await supabase.from('consultas').select('*')
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ consultas: data || [] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro no servidor' })
  }
})

// ---------------------- PRONTUÁRIOS ----------------------
app.post('/prontuarios', async (req, res) => {
  try {
    const { paciente_id, descricao, data_registro } = req.body

    const { data, error } = await supabase
      .from('prontuarios')
      .insert([{ paciente_id, descricao, data_registro }])
      .select()

    if (error) return res.status(400).json({ error: error.message })
    if (!data || data.length === 0) return res.status(500).json({ error: 'Falha ao inserir prontuário' })

    return res.status(201).json({ prontuario: data[0] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro no servidor' })
  }
})

app.get('/prontuarios', async (req, res) => {
  try {
    const { data, error } = await supabase.from('prontuarios').select('*')
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ prontuarios: data || [] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro no servidor' })
  }
})

// ---------------------- CLÍNICAS ----------------------
app.post('/clinicas', async (req, res) => {
  try {
    const { nome, endereco, telefone } = req.body

    const { data, error } = await supabase
      .from('clinicas')
      .insert([{ nome, endereco, telefone }])
      .select()

    if (error) return res.status(400).json({ error: error.message })
    if (!data || data.length === 0) return res.status(500).json({ error: 'Falha ao inserir clínica' })

    return res.status(201).json({ clinica: data[0] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro no servidor' })
  }
})

app.get('/clinicas', async (req, res) => {
  try {
    const { data, error } = await supabase.from('clinicas').select('*')
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ clinicas: data || [] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro no servidor' })
  }
})

// ---------------------- START SERVER ----------------------
app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`)
})
