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
  const { data, error } = await supabase.from('clinicas').select('*').order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

export default router
