import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar, apenasAdmin } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar, apenasAdmin)

router.get('/clinicas', async (req, res) => {
  const { data, error } = await supabase.from('clinicas').select('*').order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/clinicas', async (req, res) => {
  const { nome, cnpj, endereco, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body
  if (!nome || !cnpj) return res.status(400).json({ error: 'Nome e CNPJ obrigatórios.' })
  const { data, error } = await supabase.from('clinicas')
    .insert([{ nome, cnpj, endereco, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, ativo: true }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'criar', tabela: 'clinicas', registro_id: data[0].id, detalhes: { nome, cnpj } })
  res.status(201).json(data[0])
})

router.patch('/clinicas/:id/status', async (req, res) => {
  const { data, error } = await supabase.from('clinicas').update({ ativo: req.body.ativo }).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'status', tabela: 'clinicas', registro_id: req.params.id, detalhes: { ativo: req.body.ativo } })
  res.json(data[0])
})

router.get('/usuarios', async (req, res) => {
  const { data, error } = await supabase.from('usuarios').select('id,nome,email,perfil,status,clinica_id').order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.patch('/usuarios/:id', async (req, res) => {
  const body = req.body
  const u = {}
  if ('perfil'     in body) u.perfil     = body.perfil
  if ('status'     in body) u.status     = body.status
  if ('clinica_id' in body) u.clinica_id = body.clinica_id || null
  if (!Object.keys(u).length) return res.status(400).json({ error: 'Nada para atualizar.' })
  const { data, error } = await supabase.from('usuarios').update(u).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  if (!data?.length) return res.status(404).json({ error: 'Usuário não encontrado.' })
  await registrarLog({ usuario: req.usuario, acao: 'editar', tabela: 'usuarios', registro_id: req.params.id, detalhes: u })
  res.json(data[0])
})

export default router
