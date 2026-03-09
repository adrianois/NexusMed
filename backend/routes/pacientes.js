import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'

const router = Router()
router.use(autenticar)

// GET /pacientes
router.get('/', async (req, res) => {
  const { perfil, clinica_id } = req.usuario
  let q = supabase.from('pacientes').select('*').order('nome')
  if (perfil !== 'admin' && clinica_id) q = q.eq('clinica_id', clinica_id)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// POST /pacientes
router.post('/', async (req, res) => {
  const { data, error } = await supabase.from('pacientes')
    .insert([{ ...req.body, clinica_id: req.usuario.clinica_id }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data[0])
})

// PUT /pacientes/:id
router.put('/:id', async (req, res) => {
  const { data, error } = await supabase.from('pacientes').update(req.body).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

// DELETE /pacientes/:id
router.delete('/:id', async (req, res) => {
  const [{ data: c }, { data: p }] = await Promise.all([
    supabase.from('consultas').select('id').eq('paciente_id', req.params.id).limit(1),
    supabase.from('prontuarios').select('id').eq('paciente_id', req.params.id).limit(1)
  ])
  if (c?.length > 0) return res.status(400).json({ error: 'Não é possível excluir: paciente possui consultas vinculadas.' })
  if (p?.length > 0) return res.status(400).json({ error: 'Não é possível excluir: paciente possui prontuários vinculados.' })
  const { error } = await supabase.from('pacientes').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Paciente removido com sucesso.' })
})

export default router
