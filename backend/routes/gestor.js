import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar, apenasGestor } from '../lib/auth.js'

const router = Router()
router.use(autenticar, apenasGestor)

// GET /gestor/minha-clinica
router.get('/minha-clinica', async (req, res) => {
  if (!req.usuario.clinica_id) return res.json(null)
  const { data, error } = await supabase.from('clinicas')
    .select('id,nome,endereco,telefone')
    .eq('id', req.usuario.clinica_id)
    .limit(1)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data?.[0] || null)
})

// GET /gestor/usuarios/pendentes
router.get('/usuarios/pendentes', async (req, res) => {
  if (!req.usuario.clinica_id) return res.status(400).json({ error: 'Gestor sem clínica.' })
  const { data, error } = await supabase.from('usuarios')
    .select('id,nome,email,perfil,status')
    .eq('clinica_id', req.usuario.clinica_id)
    .eq('status', 'pendente')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// PATCH /gestor/usuarios/:id/aprovar
router.patch('/usuarios/:id/aprovar', async (req, res) => {
  const { data, error } = await supabase.from('usuarios')
    .update({ status: req.body.aprovado ? 'ativo' : 'inativo' })
    .eq('id', req.params.id)
    .select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

export default router
