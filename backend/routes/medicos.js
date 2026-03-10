import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

router.get('/', async (req, res) => {
  const { perfil, clinica_id } = req.usuario
  let q = supabase.from('medicos').select('*').order('nome')
  if (perfil !== 'admin' && clinica_id) q = q.eq('clinica_id', clinica_id)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

router.post('/', async (req, res) => {
  const { nome, crm, especialidade, telefone, email, agenda } = req.body
  if (!nome || !crm) return res.status(400).json({ error: 'Nome e CRM são obrigatórios.' })
  const { data, error } = await supabase.from('medicos')
    .insert([{ nome, crm, especialidade, telefone, email, clinica_id: req.usuario.clinica_id, ativo: true, agenda: agenda || {} }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'criar', tabela: 'medicos', registro_id: data[0].id, detalhes: { nome, crm, especialidade } })
  res.status(201).json(data[0])
})

router.patch('/:id', async (req, res) => {
  const campos = ['nome','crm','especialidade','telefone','email','ativo','agenda']
  const u = Object.fromEntries(campos.filter(k => k in req.body).map(k => [k, req.body[k]]))
  const { data, error } = await supabase.from('medicos').update(u).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'editar', tabela: 'medicos', registro_id: req.params.id, detalhes: u })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { data: vinculos } = await supabase.from('consultas').select('id').eq('medico_id', req.params.id).limit(1)
  if (vinculos?.length > 0)
    return res.status(400).json({ error: 'Não é possível excluir: médico possui consultas vinculadas.' })
  const { error } = await supabase.from('medicos').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'excluir', tabela: 'medicos', registro_id: req.params.id })
  res.json({ message: 'Médico excluído com sucesso.' })
})

export default router
