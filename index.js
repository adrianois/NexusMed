import express from 'express'
import { createClient } from '@supabase/supabase-js'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
)

app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo ao NexusMed API', version: '1.0.0', endpoints: ['/pacientes'] })
})

app.get('/pacientes', async (req, res) => {
  const { data, error } = await supabase.from('pacientes').select('*')
  if (error) return res.status(400).json(error)
  res.json(data)
})

app.post('/pacientes', async (req, res) => {
  const { error, data } = await supabase.from('pacientes').insert([req.body])
  if (error) return res.status(400).json(error)
  res.status(201).json({ message: 'Paciente criado com sucesso', data })
})

// CREATE - cadastrar consulta
app.post('/consultas', async (req, res) => {
  const { paciente_id, medico_id, data_consulta, motivo, observacoes } = req.body
  const { data, error } = await supabase
    .from('consultas')
    .insert([{ paciente_id, medico_id, data_consulta, motivo, observacoes }])

  if (error) return res.status(400).json(error)
  res.status(201).json({ message: 'Consulta criada com sucesso', data })
})

// READ - listar consultas
app.get('/consultas', async (req, res) => {
  const { data, error } = await supabase.from('consultas').select('*')
  if (error) return res.status(400).json(error)
  res.json(data)
})

// UPDATE - atualizar consulta
app.put('/consultas/:id', async (req, res) => {
  const { id } = req.params
  const { motivo, observacoes, data_consulta } = req.body
  const { data, error } = await supabase
    .from('consultas')
    .update({ motivo, observacoes, data_consulta })
    .eq('id', id)

  if (error) return res.status(400).json(error)
  res.json(data)
})

// DELETE - remover consulta
app.delete('/consultas/:id', async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase.from('consultas').delete().eq('id', id)

  if (error) return res.status(400).json(error)
  res.json(data)
})

// CREATE - cadastrar prontuário
app.post('/prontuarios', async (req, res) => {
  const { paciente_id, consulta_id, descricao, exames, prescricoes } = req.body
  const { data, error } = await supabase
    .from('prontuarios')
    .insert([{ paciente_id, consulta_id, descricao, exames, prescricoes }])

  if (error) return res.status(400).json(error)
  res.status(201).json({ message: 'Prontuário criado com sucesso', data })
})

// READ - listar prontuários
app.get('/prontuarios', async (req, res) => {
  const { data, error } = await supabase.from('prontuarios').select('*')
  if (error) return res.status(400).json(error)
  res.json(data)
})

// UPDATE - atualizar prontuário
app.put('/prontuarios/:id', async (req, res) => {
  const { id } = req.params
  const { descricao, exames, prescricoes } = req.body
  const { data, error } = await supabase
    .from('prontuarios')
    .update({ descricao, exames, prescricoes })
    .eq('id', id)

  if (error) return res.status(400).json(error)
  res.json(data)
})

// DELETE - remover prontuário
app.delete('/prontuarios/:id', async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase.from('prontuarios').delete().eq('id', id)

  if (error) return res.status(400).json(error)
  res.json(data)
})

app.listen(3000, () => console.log('Servidor rodando na porta 3000'))
