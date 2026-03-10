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
  if (!req.usuario.clinica_id) return res.status(400).json({ error: 'Gestor sem cl\u00ednica.' })
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

// GET /gestor/logs?acao=&tabela=&page=1
// Retorna logs dos usuários da clínica do gestor
router.get('/logs', async (req, res) => {
  const clinica_id = req.usuario.clinica_id
  if (!clinica_id) return res.status(400).json({ error: 'Gestor sem cl\u00ednica.' })

  const { acao, tabela, page = 1 } = req.query
  const limit  = 50
  const offset = (Number(page) - 1) * limit

  // Busca IDs dos usuários da clínica
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id')
    .eq('clinica_id', clinica_id)

  const ids = (usuarios || []).map(u => u.id)
  if (ids.length === 0) return res.json({ logs: [], total: 0, page: Number(page), limit })

  let q = supabase.from('logs')
    .select('*', { count: 'exact' })
    .in('usuario_id', ids)
    .order('criado_em', { ascending: false })
    .range(offset, offset + limit - 1)

  if (acao)   q = q.eq('acao', acao)
  if (tabela) q = q.eq('tabela', tabela)

  const { data, count, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json({ logs: data || [], total: count || 0, page: Number(page), limit })
})

// GET /gestor/logs/resumo - contagens por ação para os cards do dashboard
router.get('/logs/resumo', async (req, res) => {
  const clinica_id = req.usuario.clinica_id
  if (!clinica_id) return res.status(400).json({ error: 'Gestor sem cl\u00ednica.' })

  const { data: usuarios } = await supabase.from('usuarios').select('id').eq('clinica_id', clinica_id)
  const ids = (usuarios || []).map(u => u.id)
  if (ids.length === 0) return res.json({ total:0, hoje:0, acoes:{} })

  const hoje = new Date()
  hoje.setHours(0,0,0,0)

  const { data: todos }  = await supabase.from('logs').select('acao, criado_em').in('usuario_id', ids)
  const registros = todos || []

  const acoes = {}
  let totalHoje = 0
  for (const r of registros) {
    acoes[r.acao] = (acoes[r.acao] || 0) + 1
    if (new Date(r.criado_em) >= hoje) totalHoje++
  }

  res.json({ total: registros.length, hoje: totalHoje, acoes })
})

export default router
