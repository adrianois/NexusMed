import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { normalizarData } from '../lib/utils.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

const normalizar = (c) => ({ ...c, data_consulta: normalizarData(c.data_consulta) })

router.get('/', async (req, res) => {
  const { perfil, clinica_id } = req.usuario
  let q = supabase.from('consultas').select('*').order('data_consulta').order('horario')
  if (perfil !== 'admin' && clinica_id) q = q.eq('clinica_id', clinica_id)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json((data || []).map(normalizar))
})

router.post('/', async (req, res) => {
  const { paciente_id, medico_id, data_consulta, horario, motivo, observacoes } = req.body
  if (!paciente_id || !data_consulta || !motivo)
    return res.status(400).json({ error: 'Paciente, data e motivo são obrigatórios.' })
  const { data, error } = await supabase.from('consultas')
    .insert([{ paciente_id, medico_id: medico_id || null,
      data_consulta: normalizarData(data_consulta), horario,
      motivo, observacoes, status: 'agendada',
      clinica_id: req.usuario.clinica_id }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'criar', tabela: 'consultas', registro_id: data[0].id, detalhes: { paciente_id, medico_id, data_consulta, horario, motivo } })
  res.status(201).json(normalizar(data[0]))
})

router.put('/:id', async (req, res) => {
  const { paciente_id, medico_id, data_consulta, horario, motivo, observacoes } = req.body
  const { data, error } = await supabase.from('consultas')
    .update({ paciente_id, medico_id: medico_id || null,
      data_consulta: normalizarData(data_consulta), horario, motivo, observacoes })
    .eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'editar', tabela: 'consultas', registro_id: req.params.id, detalhes: { data_consulta, horario, motivo } })
  res.json(normalizar(data[0]))
})

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  const statusValidos = ['agendada', 'confirmada', 'em_triagem', 'triado', 'liberada']
  if (!statusValidos.includes(status))
    return res.status(400).json({ error: `Status inválido. Use: ${statusValidos.join(', ')}` })
  const { data: anterior } = await supabase.from('consultas').select('status').eq('id', req.params.id).limit(1)
  const { data, error } = await supabase.from('consultas').update({ status }).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  if (!data?.length) return res.status(404).json({ error: 'Consulta não encontrada.' })
  await registrarLog({ usuario: req.usuario, acao: 'status', tabela: 'consultas', registro_id: req.params.id, detalhes: { de: anterior?.[0]?.status, para: status } })
  res.json(normalizar(data[0]))
})

router.delete('/:id', async (req, res) => {
  const { data: p } = await supabase.from('prontuarios').select('id').eq('consulta_id', req.params.id).limit(1)
  if (p?.length > 0)
    return res.status(400).json({ error: 'Não é possível excluir: consulta possui prontuários vinculados.' })
  const { error } = await supabase.from('consultas').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'excluir', tabela: 'consultas', registro_id: req.params.id })
  res.json({ message: 'Consulta removida com sucesso.' })
})

export default router
