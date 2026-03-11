import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { normalizarData } from '../lib/utils.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

// GET /triagem?data=2026-03-11
// Lista consultas confirmadas do dia para triagem
router.get('/', async (req, res) => {
  try {
    const { clinica_id, perfil } = req.usuario
    const data = req.query.data || new Date().toISOString().split('T')[0]

    let q = supabase
      .from('consultas')
      .select('*')
      .in('status', ['confirmada', 'em_triagem', 'triado'])
      .eq('data_consulta', data)
      .order('horario')

    if (perfil !== 'admin' && clinica_id) q = q.eq('clinica_id', clinica_id)

    const { data: consultas, error } = await q
    if (error) throw new Error(error.message)

    res.json((consultas || []).map(c => ({ ...c, data_consulta: normalizarData(c.data_consulta) })))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /triagem/dashboard
// Estatisticas do dia para o dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { clinica_id, perfil } = req.usuario
    const data = req.query.data || new Date().toISOString().split('T')[0]

    let q = supabase
      .from('consultas')
      .select('status')
      .eq('data_consulta', data)

    if (perfil !== 'admin' && clinica_id) q = q.eq('clinica_id', clinica_id)

    const { data: consultas, error } = await q
    if (error) throw new Error(error.message)

    const lista = consultas || []
    const contagem = lista.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {})

    res.json({
      total:       lista.length,
      agendada:    contagem.agendada    || 0,
      confirmada:  contagem.confirmada  || 0,
      em_triagem:  contagem.em_triagem  || 0,
      triado:      contagem.triado      || 0,
      liberada:    contagem.liberada    || 0,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /triagem/:id/iniciar
// Muda status para em_triagem
router.post('/:id/iniciar', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consultas')
      .update({ status: 'em_triagem' })
      .eq('id', req.params.id)
      .select()
    if (error) throw new Error(error.message)
    if (!data?.length) return res.status(404).json({ error: 'Consulta nao encontrada.' })
    await registrarLog({ usuario: req.usuario, acao: 'status', tabela: 'consultas', registro_id: req.params.id, detalhes: { de: 'confirmada', para: 'em_triagem' } })
    res.json(data[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /triagem/:id/finalizar
// Salva dados da triagem e muda status para triado
router.post('/:id/finalizar', async (req, res) => {
  try {
    const {
      peso, altura, pressao_arterial, temperatura,
      frequencia_cardiaca, saturacao_oxigenio,
      queixa_principal, observacoes_triagem, prioridade
    } = req.body

    const prioridades = ['normal', 'prioritario', 'urgente', 'emergencia']
    if (prioridade && !prioridades.includes(prioridade))
      return res.status(400).json({ error: 'Prioridade inválida.' })

    const triagem_em = new Date().toISOString()

    const { data, error } = await supabase
      .from('consultas')
      .update({
        status: 'triado',
        triagem_peso:             peso             || null,
        triagem_altura:           altura           || null,
        triagem_pressao:          pressao_arterial || null,
        triagem_temperatura:      temperatura      || null,
        triagem_freq_cardiaca:    frequencia_cardiaca || null,
        triagem_saturacao:        saturacao_oxigenio  || null,
        triagem_queixa:           queixa_principal || null,
        triagem_obs:              observacoes_triagem || null,
        triagem_prioridade:       prioridade       || 'normal',
        triagem_em,
        triagem_usuario_id:       req.usuario.usuario_id,
        triagem_usuario_nome:     req.usuario.nome,
      })
      .eq('id', req.params.id)
      .select()

    if (error) throw new Error(error.message)
    if (!data?.length) return res.status(404).json({ error: 'Consulta nao encontrada.' })

    await registrarLog({
      usuario: req.usuario, acao: 'status', tabela: 'consultas',
      registro_id: req.params.id,
      detalhes: { de: 'em_triagem', para: 'triado', prioridade, peso, pressao_arterial }
    })

    res.json(data[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
