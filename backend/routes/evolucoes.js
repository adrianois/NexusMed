import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

// GET /evolucoes?paciente_id=xxx
router.get('/', async (req, res) => {
  const { paciente_id } = req.query
  const { clinica_id, perfil } = req.usuario
  let q = supabase.from('evolucoes')
    .select('*')
    .order('data_registro', { ascending: false })
  if (paciente_id) q = q.eq('paciente_id', paciente_id)
  if (perfil !== 'admin' && clinica_id) q = q.eq('clinica_id', clinica_id)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// POST /evolucoes
router.post('/', async (req, res) => {
  const { paciente_id, consulta_id, tipo, descricao, peso, altura, pressao, temperatura, saturacao, glicemia, observacoes } = req.body
  if (!paciente_id || !descricao) return res.status(400).json({ error: 'Paciente e descrição são obrigatórios.' })
  const { data, error } = await supabase.from('evolucoes').insert([{
    paciente_id,
    consulta_id:  consulta_id  || null,
    clinica_id:   req.usuario.clinica_id,
    medico_id:    req.usuario.id,
    tipo:         tipo         || 'evolucao',
    descricao,
    peso:         peso         || null,
    altura:       altura       || null,
    pressao:      pressao      || null,
    temperatura:  temperatura  || null,
    saturacao:    saturacao    || null,
    glicemia:     glicemia     || null,
    observacoes:  observacoes  || null,
    data_registro: new Date().toISOString(),
  }]).select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'criar', tabela: 'evolucoes', registro_id: data[0].id, detalhes: { paciente_id, tipo } })
  res.status(201).json(data[0])
})

// DELETE /evolucoes/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('evolucoes').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'excluir', tabela: 'evolucoes', registro_id: req.params.id })
  res.json({ message: 'Evolução removida.' })
})

export default router
