import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar, apenasAdmin } from '../lib/auth.js'

const router = Router()
router.use(autenticar, apenasAdmin)

// GET /logs?tabela=consultas&acao=excluir&usuario_id=xxx&page=1
router.get('/', async (req, res) => {
  const { tabela, acao, usuario_id, page = 1 } = req.query
  const limit  = 50
  const offset = (Number(page) - 1) * limit

  let q = supabase.from('logs')
    .select('*', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tabela)     q = q.eq('tabela', tabela)
  if (acao)       q = q.eq('acao', acao)
  if (usuario_id) q = q.eq('usuario_id', usuario_id)

  const { data, count, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json({ logs: data || [], total: count || 0, page: Number(page), limit })
})

export default router
