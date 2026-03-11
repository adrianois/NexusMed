/**
 * /pos-atendimento — Fila de pós-atendimento para recepcionista
 *
 * Fluxo:
 *  1. GET /pos-atendimento?data=YYYY-MM-DD
 *     Lista consultas com status 'liberada' na data informada (default hoje),
 *     enriquecidas com prontuário e registro de pos_atendimento (se existir).
 *
 *  2. POST /pos-atendimento
 *     Cria ou atualiza o checklist de saída de uma consulta.
 *
 *  3. PATCH /pos-atendimento/:id/finalizar
 *     Marca o registro como finalizado (paciente saiu).
 */
import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { normalizarData } from '../lib/utils.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

// ─── GET / ───────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { clinica_id, perfil } = req.usuario
    const data = req.query.data || new Date().toISOString().split('T')[0]

    // 1. Consultas liberadas na data
    let qC = supabase
      .from('consultas')
      .select('id, horario, motivo, paciente_id, medico_id, data_consulta')
      .eq('status', 'liberada')
      .eq('data_consulta', data)
      .order('horario', { ascending: true })

    if (perfil !== 'admin' && clinica_id) qC = qC.eq('clinica_id', clinica_id)

    const { data: consultas, error: ec } = await qC
    if (ec) return res.status(500).json({ error: ec.message })
    if (!consultas?.length) return res.json([])

    const consultaIds = consultas.map(c => c.id)
    const pacienteIds = [...new Set(consultas.map(c => c.paciente_id))]
    const medicoIds   = [...new Set(consultas.map(c => c.medico_id).filter(Boolean))]

    // 2. Pacientes
    const { data: pacientes } = await supabase
      .from('pacientes').select('id, nome, telefone, plano_saude').in('id', pacienteIds)

    // 3. Médicos
    const { data: medicos } = medicoIds.length
      ? await supabase.from('medicos').select('id, nome, especialidade').in('id', medicoIds)
      : { data: [] }

    // 4. Prontuários (retorno_dias, diagnostico)
    const { data: prontuarios } = await supabase
      .from('prontuarios')
      .select('consulta_id, diagnostico, retorno_dias, prescricao')
      .in('consulta_id', consultaIds)

    // 5. Registros pos_atendimento já existentes
    const { data: posExist } = await supabase
      .from('pos_atendimento')
      .select('*')
      .in('consulta_id', consultaIds)

    // 6. Monta mapa
    const pacMap  = Object.fromEntries((pacientes  || []).map(p => [p.id, p]))
    const medMap  = Object.fromEntries((medicos    || []).map(m => [m.id, m]))
    const prontMap = Object.fromEntries((prontuarios || []).map(p => [p.consulta_id, p]))
    const posMap  = Object.fromEntries((posExist   || []).map(p => [p.consulta_id, p]))

    const resultado = consultas.map(c => ({
      consulta_id:     c.id,
      horario:         c.horario,
      motivo:          c.motivo,
      data_consulta:   normalizarData(c.data_consulta),
      paciente:        pacMap[c.paciente_id]  || null,
      medico:          medMap[c.medico_id]    || null,
      prontuario:      prontMap[c.id]         || null,
      pos_atendimento: posMap[c.id]           || null,
    }))

    res.json(resultado)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── POST / ──────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      consulta_id, paciente_id,
      doc_receita, doc_atestado, doc_solicitacao_ex, doc_outros,
      cobranca_status, cobranca_obs,
      retorno_agendado, retorno_consulta_id,
      observacoes_saida,
    } = req.body

    if (!consulta_id || !paciente_id)
      return res.status(400).json({ error: 'consulta_id e paciente_id são obrigatórios.' })

    const payload = {
      consulta_id,
      paciente_id,
      clinica_id:         req.usuario.clinica_id,
      doc_receita:        doc_receita        ?? false,
      doc_atestado:       doc_atestado       ?? false,
      doc_solicitacao_ex: doc_solicitacao_ex ?? false,
      doc_outros:         doc_outros         ?? false,
      cobranca_status:    cobranca_status    || 'pendente',
      cobranca_obs:       cobranca_obs       || null,
      retorno_agendado:   retorno_agendado   ?? false,
      retorno_consulta_id: retorno_consulta_id || null,
      observacoes_saida:  observacoes_saida  || null,
      usuario_id:         req.usuario.id,
      finalizado:         false,
    }

    const { data, error } = await supabase
      .from('pos_atendimento')
      .upsert([payload], { onConflict: 'consulta_id' })
      .select()

    if (error) return res.status(400).json({ error: error.message })

    await registrarLog({
      usuario: req.usuario, acao: 'criar', tabela: 'pos_atendimento',
      registro_id: data[0].id,
      detalhes: { consulta_id, cobranca_status },
    })

    res.status(201).json(data[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── PATCH /:id/finalizar ─────────────────────────────────────────────────────
router.patch('/:id/finalizar', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pos_atendimento')
      .update({ finalizado: true })
      .eq('id', req.params.id)
      .select()

    if (error) return res.status(400).json({ error: error.message })
    if (!data?.length) return res.status(404).json({ error: 'Registro não encontrado.' })

    await registrarLog({
      usuario: req.usuario, acao: 'finalizar', tabela: 'pos_atendimento',
      registro_id: req.params.id,
    })

    res.json(data[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
