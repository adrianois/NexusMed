import express from 'express'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(express.json())

// Configuração do Supabase
const supabaseUrl = 'https://db.hxrvwjihtreswlsbfenq.supabase.co'
const supabaseKey = 'SUA_CHAVE_DE_API' // use a anon key para o backend público
const supabase = createClient(supabaseUrl, supabaseKey)

// --- CRUD Pacientes ---

// CREATE - cadastrar paciente
app.post('/pacientes', async (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email, endereco } = req.body
  const { data, error } = await supabase
    .from('pacientes')
    .insert([{ nome, cpf, data_nascimento, telefone, email, endereco }])

  if (error) return res.status(400).json(error)
  res.json(data)
})

// READ - listar pacientes
app.get('/pacientes', async (req, res) => {
  const { data, error } = await supabase.from('pacientes').select('*')
  if (error) return res.status(400).json(error)
  res.json(data)
})

// UPDATE - atualizar paciente
app.put('/pacientes/:id', async (req, res) => {
  const { id } = req.params
  const { nome, telefone, email, endereco } = req.body
  const { data, error } = await supabase
    .from('pacientes')
    .update({ nome, telefone, email, endereco })
    .eq('id', id)

  if (error) return res.status(400).json(error)
  res.json(data)
})

// DELETE - remover paciente
app.delete('/pacientes/:id', async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase.from('pacientes').delete().eq('id', id)

  if (error) return res.status(400).json(error)
  res.json(data)
})

// Servidor
app.listen(3000, () => console.log('NexusMed backend rodando na porta 3000'))
