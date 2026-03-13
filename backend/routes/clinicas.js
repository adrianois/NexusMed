import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'

const router = Router()

// GET /clinicas/publicas  (sem autenticacao)
router.get('/publicas', async (req, res) => {
  const { data, error } = await supabase.from('clinicas').select('id,nome').eq('ativo', true).order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// GET /clinicas  (autenticado)
router.get('/', autenticar, async (req, res) => {
  const { data, error } = await supabase
    .from('clinicas')
    .select('id, nome, cnpj, endereco, cidade, estado, telefone, email, logo_url, ativo')
    .order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// GET /clinicas/:id  (autenticado)
router.get('/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('clinicas')
    .select('id, nome, cnpj, endereco, cidade, estado, telefone, email, logo_url, ativo')
    .eq('id', id)
    .single()
  if (error) return res.status(404).json({ error: 'Clínica não encontrada.' })
  res.json(data)
})

// POST /clinicas  (autenticado) — criar nova clínica
router.post('/', autenticar, async (req, res) => {
  const { nome, cnpj, endereco, cidade, estado, telefone, email, logo_url } = req.body
  if (!nome || !cnpj) return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' })
  const { data, error } = await supabase
    .from('clinicas')
    .insert([{ nome, cnpj, endereco, cidade, estado, telefone, email, logo_url, ativo: true }])
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /clinicas/:id  (autenticado) — atualizar clínica
router.put('/:id', autenticar, async (req, res) => {
  const { id } = req.params
  const { nome, cnpj, endereco, cidade, estado, telefone, email, logo_url } = req.body
  const { data, error } = await supabase
    .from('clinicas')
    .update({ nome, cnpj, endereco, cidade, estado, telefone, email, logo_url })
    .eq('id', id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
