import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

router.get('/', async (req, res) => {
  const { perfil, clinica_id } = req.usuario
  let q = supabase
    .from('prontuarios')
    .select('*, pacientes(id, nome)')
    .order('data_atendimento', { ascending: false })
  if (perfil !== 'admin' && clinica_id) q = q.eq('clinica_id', clinica_id)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  // Normaliza: eleva pacientes.nome para paciente_nome no objeto raiz
  const resultado = (data || []).map(p => ({
    ...p,
    paciente_nome: p.pacientes?.nome || null,
    pacientes: undefined,
  }))
  res.json(resultado)
})

router.post('/', async (req, res) => {
  const { paciente_id, descricao, data_registro, consulta_id } = req.body
  if (!paciente_id || !descricao) return res.status(400).json({ error: 'Paciente e descrição são obrigatórios.' })
  const { data, error } = await supabase.from('prontuarios')
    .insert([{ paciente_id, descricao, data_registro, consulta_id: consulta_id || null, clinica_id: req.usuario.clinica_id }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'criar', tabela: 'prontuarios', registro_id: data[0].id, detalhes: { paciente_id, data_registro } })
  res.status(201).json(data[0])
})

export default router
