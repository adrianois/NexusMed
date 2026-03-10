import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar, apenasGestor } from '../lib/auth.js'

const router = Router()
router.use(autenticar, apenasGestor)

// Utilitario: busca IDs dos usuarios da clinica
async function idsClinica(clinica_id) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('clinica_id', clinica_id)
  if (error) throw new Error('Erro ao buscar usuarios: ' + error.message)
  return (data || []).map(u => u.id)
}

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
  if (!req.usuario.clinica_id) return res.status(400).json({ error: 'Gestor sem clinica.' })
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

// GET /gestor/logs/resumo  (DEVE vir antes de /logs)
router.get('/logs/resumo', async (req, res) => {
  try {
    const clinica_id = req.usuario.clinica_id
    if (!clinica_id) return res.status(400).json({ error: 'Gestor sem clinica.' })

    const ids = await idsClinica(clinica_id)
    if (ids.length === 0) return res.json({ total: 0, hoje: 0, acoes: {} })

    // Busca todos os logs dos usuarios da clinica (sem paginacao, so acao e data)
    const { data: todos, error } = await supabase
      .from('logs')
      .select('acao, criado_em')
      .in('usuario_id', ids)

    if (error) throw new Error(error.message)

    const registros = todos || []
    const hojeInicio = new Date(); hojeInicio.setHours(0, 0, 0, 0)

    const acoes = {}
    let totalHoje = 0
    for (const r of registros) {
      acoes[r.acao] = (acoes[r.acao] || 0) + 1
      if (new Date(r.criado_em) >= hojeInicio) totalHoje++
    }

    res.json({ total: registros.length, hoje: totalHoje, acoes })
  } catch (e) {
    console.error('[GET /gestor/logs/resumo]', e.message)
    res.status(500).json({ error: e.message })
  }
})

// GET /gestor/logs
router.get('/logs', async (req, res) => {
  try {
    const clinica_id = req.usuario.clinica_id
    if (!clinica_id) return res.status(400).json({ error: 'Gestor sem clinica.' })

    const { acao, tabela, page = 1 } = req.query
    const limit  = 50
    const offset = (Number(page) - 1) * limit

    const ids = await idsClinica(clinica_id)
    if (ids.length === 0) return res.json({ logs: [], total: 0, page: Number(page), limit })

    // Estrategia: busca todos os IDs filtrados primeiro, depois pagina
    // Isso evita bug do Supabase com .in() + .eq() + .range() combinados
    let qCount = supabase
      .from('logs')
      .select('id', { count: 'exact', head: true })
      .in('usuario_id', ids)

    let qData = supabase
      .from('logs')
      .select('*')
      .in('usuario_id', ids)
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1)

    if (acao)   { qCount = qCount.eq('acao', acao);     qData = qData.eq('acao', acao)   }
    if (tabela) { qCount = qCount.eq('tabela', tabela); qData = qData.eq('tabela', tabela) }

    const [{ count, error: errCount }, { data, error: errData }] = await Promise.all([qCount, qData])

    if (errCount) throw new Error('count: ' + errCount.message)
    if (errData)  throw new Error('data: '  + errData.message)

    res.json({ logs: data || [], total: count || 0, page: Number(page), limit })
  } catch (e) {
    console.error('[GET /gestor/logs]', e.message)
    res.status(500).json({ error: e.message })
  }
})

export default router
