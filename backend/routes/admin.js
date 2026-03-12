import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar, apenasAdmin } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar, apenasAdmin)

// GET /admin/clinicas
router.get('/clinicas', async (req, res) => {
  const { data, error } = await supabase.from('clinicas').select('*').order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// POST /admin/clinicas
router.post('/clinicas', async (req, res) => {
  const { nome, cnpj, endereco, telefone, email,
    cep, logradouro, numero, complemento, bairro, cidade, estado, usa_triagem } = req.body
  if (!nome || !cnpj) return res.status(400).json({ error: 'Nome e CNPJ obrigatorios.' })
  const { data, error } = await supabase.from('clinicas')
    .insert([{ nome, cnpj, endereco, telefone, email,
      cep, logradouro, numero, complemento, bairro, cidade, estado,
      usa_triagem: usa_triagem === true || usa_triagem === 'true', ativo: true }])
    .select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'criar', tabela: 'clinicas', registro_id: data[0].id, detalhes: { nome, cnpj } })
  res.status(201).json(data[0])
})

// PUT /admin/clinicas/:id
router.put('/clinicas/:id', async (req, res) => {
  const { nome, cnpj, telefone, email,
    cep, logradouro, numero, complemento, bairro, cidade, estado, usa_triagem } = req.body
  if (!nome || !cnpj) return res.status(400).json({ error: 'Nome e CNPJ obrigatorios.' })
  const enderecoStr = [logradouro, numero, bairro, cidade, estado].filter(Boolean).join(', ')
  const { data, error } = await supabase.from('clinicas')
    .update({ nome, cnpj, telefone, email,
      cep, logradouro, numero, complemento, bairro, cidade, estado,
      endereco: enderecoStr,
      usa_triagem: usa_triagem === true || usa_triagem === 'true' })
    .eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  if (!data?.length) return res.status(404).json({ error: 'Clínica não encontrada.' })
  await registrarLog({ usuario: req.usuario, acao: 'editar', tabela: 'clinicas', registro_id: req.params.id, detalhes: { nome, cnpj } })
  res.json(data[0])
})

// DELETE /admin/clinicas/:id
router.delete('/clinicas/:id', async (req, res) => {
  // Verifica se há usuários vinculados
  const { data: usuarios } = await supabase.from('usuarios').select('id').eq('clinica_id', req.params.id).limit(1)
  if (usuarios?.length > 0)
    return res.status(400).json({ error: 'Não é possível excluir: clínica possui usuários vinculados.' })
  const { error } = await supabase.from('clinicas').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'excluir', tabela: 'clinicas', registro_id: req.params.id })
  res.json({ message: 'Clínica excluída com sucesso.' })
})

// PATCH /admin/clinicas/:id/status
router.patch('/clinicas/:id/status', async (req, res) => {
  const { data, error } = await supabase.from('clinicas')
    .update({ ativo: req.body.ativo }).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'status', tabela: 'clinicas', registro_id: req.params.id, detalhes: { ativo: req.body.ativo } })
  res.json(data[0])
})

// PATCH /admin/clinicas/:id/triagem
router.patch('/clinicas/:id/triagem', async (req, res) => {
  const usa_triagem = req.body.usa_triagem === true || req.body.usa_triagem === 'true'
  const { data, error } = await supabase.from('clinicas')
    .update({ usa_triagem }).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'editar', tabela: 'clinicas', registro_id: req.params.id, detalhes: { usa_triagem } })
  res.json(data[0])
})

// GET /admin/usuarios
router.get('/usuarios', async (req, res) => {
  const { data, error } = await supabase.from('usuarios')
    .select('id,nome,email,perfil,status,clinica_id,criado_em').order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// PATCH /admin/usuarios/:id/status
router.patch('/usuarios/:id/status', async (req, res) => {
  const { status } = req.body
  if (!['ativo','inativo','pendente'].includes(status))
    return res.status(400).json({ error: 'Status invalido.' })
  const { data, error } = await supabase.from('usuarios')
    .update({ status }).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  await registrarLog({ usuario: req.usuario, acao: 'status', tabela: 'usuarios', registro_id: req.params.id, detalhes: { status } })
  res.json(data[0])
})

export default router
