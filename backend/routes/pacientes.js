import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

// Apenas colunas que existem na tabela pacientes
function sanitizar(body) {
  const campos = [
    'nome', 'cpf', 'data_nascimento', 'telefone', 'email',
    'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado',
    'plano_saude', 'numero_carteirinha', 'observacoes'
  ]
  const obj = {}
  for (const c of campos) {
    if (body[c] !== undefined) obj[c] = body[c] || null
  }
  return obj
}

router.get('/', async (req, res) => {
  const { perfil, clinica_id } = req.usuario
  let q = supabase.from('pacientes').select('*').order('nome')
  if (perfil !== 'admin' && clinica_id) q = q.eq('clinica_id', clinica_id)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

router.post('/', async (req, res) => {
  const payload = { ...sanitizar(req.body), clinica_id: req.usuario.clinica_id }
  const { data, error } = await supabase.from('pacientes').insert([payload]).select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({
    usuario: req.usuario, acao: 'criar', tabela: 'pacientes',
    registro_id: data[0].id, detalhes: { nome: req.body.nome, cpf: req.body.cpf }
  })
  res.status(201).json(data[0])
})

router.put('/:id', async (req, res) => {
  const payload = sanitizar(req.body)
  const { data, error } = await supabase.from('pacientes').update(payload).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({
    usuario: req.usuario, acao: 'editar', tabela: 'pacientes',
    registro_id: req.params.id, detalhes: { nome: req.body.nome }
  })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const [{ data: c }, { data: p }] = await Promise.all([
    supabase.from('consultas').select('id').eq('paciente_id', req.params.id).limit(1),
    supabase.from('prontuarios').select('id').eq('paciente_id', req.params.id).limit(1)
  ])
  if (c?.length > 0) return res.status(400).json({ error: 'Não é possível excluir: paciente possui consultas vinculadas.' })
  if (p?.length > 0) return res.status(400).json({ error: 'Não é possível excluir: paciente possui prontuários vinculados.' })
  const { error } = await supabase.from('pacientes').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'excluir', tabela: 'pacientes', registro_id: req.params.id })
  res.json({ message: 'Paciente removido com sucesso.' })
})

export default router
