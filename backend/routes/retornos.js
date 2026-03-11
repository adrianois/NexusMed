import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { normalizarData } from '../lib/utils.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

// ─── GET / ─── lista retornos com filtros opcionais
router.get('/', async (req, res) => {
  const { perfil, clinica_id } = req.usuario
  const { status, paciente_id, data_inicio, data_fim } = req.query

  let q = supabase
    .from('retornos')
    .select(`
      *,
      pacientes (id, nome),
      consultas (id, data_consulta, motivo),
      usuarios:medico_id (id, nome)
    `)
    .order('data_retorno', { ascending: true })

  if (perfil !== 'admin' && clinica_id) q = q.eq('clinica_id', clinica_id)
  if (status)      q = q.eq('status', status)
  if (paciente_id) q = q.eq('paciente_id', paciente_id)
  if (data_inicio)  q = q.gte('data_retorno', data_inicio)
  if (data_fim)     q = q.lte('data_retorno', data_fim)

  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json(
    (data || []).map(r => ({ ...r, data_retorno: normalizarData(r.data_retorno) }))
  )
})

// ─── GET /:id ─── busca retorno por id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('retornos')
    .select(`
      *,
      pacientes (id, nome),
      consultas (id, data_consulta, motivo),
      usuarios:medico_id (id, nome)
    `)
    .eq('id', req.params.id)
    .limit(1)
  if (error) return res.status(500).json({ error: error.message })
  if (!data?.length) return res.status(404).json({ error: 'Retorno não encontrado.' })
  const r = data[0]
  res.json({ ...r, data_retorno: normalizarData(r.data_retorno) })
})

// ─── POST / ─── criar retorno
router.post('/', async (req, res) => {
  const { consulta_id, paciente_id, medico_id, data_retorno, motivo, observacoes } = req.body
  if (!paciente_id || !data_retorno || !motivo)
    return res.status(400).json({ error: 'Paciente, data de retorno e motivo são obrigatórios.' })

  const { data, error } = await supabase
    .from('retornos')
    .insert([{
      consulta_id: consulta_id || null,
      paciente_id,
      medico_id: medico_id || null,
      data_retorno: normalizarData(data_retorno),
      motivo,
      observacoes: observacoes || null,
      status: 'pendente',
      clinica_id: req.usuario.clinica_id,
    }])
    .select()

  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({
    usuario: req.usuario, acao: 'criar', tabela: 'retornos',
    registro_id: data[0].id,
    detalhes: { paciente_id, medico_id, data_retorno, motivo },
  })
  res.status(201).json({ ...data[0], data_retorno: normalizarData(data[0].data_retorno) })
})

// ─── PUT /:id ─── atualizar retorno
router.put('/:id', async (req, res) => {
  const { consulta_id, paciente_id, medico_id, data_retorno, motivo, observacoes } = req.body
  const { data, error } = await supabase
    .from('retornos')
    .update({
      consulta_id: consulta_id || null,
      paciente_id,
      medico_id: medico_id || null,
      data_retorno: normalizarData(data_retorno),
      motivo,
      observacoes: observacoes || null,
    })
    .eq('id', req.params.id)
    .select()

  if (error) return res.status(400).json({ error: error.message })
  if (!data?.length) return res.status(404).json({ error: 'Retorno não encontrado.' })
  await registrarLog({
    usuario: req.usuario, acao: 'editar', tabela: 'retornos',
    registro_id: req.params.id,
    detalhes: { data_retorno, motivo },
  })
  res.json({ ...data[0], data_retorno: normalizarData(data[0].data_retorno) })
})

// ─── PATCH /:id/status ─── atualizar status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  const statusValidos = ['pendente', 'agendado', 'realizado', 'cancelado']
  if (!statusValidos.includes(status))
    return res.status(400).json({ error: `Status inválido. Use: ${statusValidos.join(', ')}` })

  const { data: anterior } = await supabase
    .from('retornos').select('status').eq('id', req.params.id).limit(1)

  const { data, error } = await supabase
    .from('retornos').update({ status }).eq('id', req.params.id).select()

  if (error) return res.status(400).json({ error: error.message })
  if (!data?.length) return res.status(404).json({ error: 'Retorno não encontrado.' })

  await registrarLog({
    usuario: req.usuario, acao: 'status', tabela: 'retornos',
    registro_id: req.params.id,
    detalhes: { de: anterior?.[0]?.status, para: status },
  })
  res.json({ ...data[0], data_retorno: normalizarData(data[0].data_retorno) })
})

// ─── DELETE /:id ─── excluir retorno
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('retornos').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({
    usuario: req.usuario, acao: 'excluir', tabela: 'retornos',
    registro_id: req.params.id,
  })
  res.json({ message: 'Retorno removido com sucesso.' })
})

export default router
