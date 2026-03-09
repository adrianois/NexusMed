import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { normalizarData } from '../lib/utils.js'

const router = Router()
router.use(autenticar)

const normalizar = (c) => ({ ...c, data_consulta: normalizarData(c.data_consulta) })

// GET /consultas
router.get('/', async (req, res) => {
  const { perfil, clinica_id } = req.usuario
  let q = supabase.from('consultas').select('*').order('data_consulta').order('horario')
  if (perfil !== 'admin' && clinica_id) q = q.eq('clinica_id', clinica_id)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json((data || []).map(normalizar))
})

// POST /consultas
router.post('/', async (req, res) => {
  const { paciente_id, medico_id, data_consulta, horario, motivo, observacoes } = req.body
  if (!paciente_id || !data_consulta || !motivo)
    return res.status(400).json({ error: 'Paciente, data e motivo são obrigatórios.' })
  const { data, error } = await supabase.from('consultas')
    .insert([{ paciente_id, medico_id: medico_id || null, data_consulta: normalizarData(data_consulta), horario, motivo, observacoes, clinica_id: req.usuario.clinica_id }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(normalizar(data[0]))
})

// PUT /consultas/:id
router.put('/:id', async (req, res) => {
  const { paciente_id, medico_id, data_consulta, horario, motivo, observacoes } = req.body
  const { data, error } = await supabase.from('consultas')
    .update({ paciente_id, medico_id: medico_id || null, data_consulta: normalizarData(data_consulta), horario, motivo, observacoes })
    .eq('id', req.params.id)
    .select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(normalizar(data[0]))
})

// DELETE /consultas/:id
router.delete('/:id', async (req, res) => {
  const { data: p } = await supabase.from('prontuarios').select('id').eq('consulta_id', req.params.id).limit(1)
  if (p?.length > 0)
    return res.status(400).json({ error: 'Não é possível excluir: consulta possui prontuários vinculados.' })
  const { error } = await supabase.from('consultas').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Consulta removida com sucesso.' })
})

export default router
