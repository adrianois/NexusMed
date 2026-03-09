import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar, apenasAdmin } from '../lib/auth.js'

const router = Router()
router.use(autenticar, apenasAdmin)

// GET /admin/clinicas
router.get('/clinicas', async (req, res) => {
  const { data, error } = await supabase.from('clinicas').select('*').order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /admin/clinicas
router.post('/clinicas', async (req, res) => {
  const { nome, cnpj, endereco, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body
  if (!nome || !cnpj) return res.status(400).json({ error: 'Nome e CNPJ obrigatórios.' })
  const { data, error } = await supabase.from('clinicas')
    .insert([{ nome, cnpj, endereco, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, ativo: true }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data[0])
})

// PATCH /admin/clinicas/:id/status
router.patch('/clinicas/:id/status', async (req, res) => {
  const { data, error } = await supabase.from('clinicas')
    .update({ ativo: req.body.ativo })
    .eq('id', req.params.id)
    .select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

// GET /admin/usuarios
router.get('/usuarios', async (req, res) => {
  const { data, error } = await supabase.from('usuarios')
    .select('id,nome,email,perfil,status,clinica_id')
    .order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// PATCH /admin/usuarios/:id
router.patch('/usuarios/:id', async (req, res) => {
  const body = req.body
  const u = {}
  if ('perfil'     in body) u.perfil     = body.perfil
  if ('status'     in body) u.status     = body.status
  if ('clinica_id' in body) u.clinica_id = body.clinica_id || null
  if (!Object.keys(u).length) return res.status(400).json({ error: 'Nada para atualizar.' })
  const { data, error } = await supabase.from('usuarios').update(u).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  if (!data?.length) return res.status(404).json({ error: 'Usuário não encontrado.' })
  res.json(data[0])
})

export default router
