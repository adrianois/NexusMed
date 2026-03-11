/**
 * /medico — rotas exclusivas do perfil 'medico'
 */
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

router.use((req, res, next) => {
  const permitidos = ['medico', 'gestor', 'admin', 'normal']
  if (!permitidos.includes(req.usuario.perfil))
    return res.status(403).json({ error: 'Acesso restrito.' })
  next()
})

async function getMedicoId(req) {
  if (req.usuario.perfil === 'medico') {
    // JWT pode ter 'id' (novo) ou 'usuario_id' (legado) — suporta ambos
    const uid = req.usuario.id || req.usuario.usuario_id
    const { data, error } = await supabase
      .from('medicos')
      .select('id')
      .eq('usuario_id', uid)
      .maybeSingle()
    if (error) console.error('[getMedicoId] Supabase error:', error.message, '| uid:', uid)
    return data?.id || null
  }
  return req.query.medico_id || null
}

function gerarDescricao({ diagnostico, anamnese, conduta }) {
  const partes = []
  if (diagnostico) partes.push(`Diagnóstico: ${diagnostico}`)
  if (anamnese)    partes.push(`Anamnese: ${anamnese.slice(0, 120)}${anamnese.length > 120 ? '...' : ''}`)
  if (conduta)     partes.push(`Conduta: ${conduta.slice(0, 100)}${conduta.length > 100 ? '...' : ''}`)
  return partes.length > 0 ? partes.join(' | ') : 'Atendimento médico registrado.'
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const TIPOS_DOCUMENTO = [
  'atestado', 'relatorio', 'receita_simples',
  'receita_antimicrobiano', 'receita_controle_especial',
  'solicitacao_exames', 'laudo', 'parecer_tecnico',
]

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const medico_id = await getMedicoId(req)
    const hoje = new Date().toISOString().split('T')[0]
    let qBase = supabase.from('consultas').select('id, status, data_consulta')
    if (medico_id) qBase = qBase.eq('medico_id', medico_id)
    if (req.usuario.clinica_id) qBase = qBase.eq('clinica_id', req.usuario.clinica_id)
    const { data: todas } = await qBase
    const total_hoje   = (todas || []).filter(c => c.data_consulta === hoje).length
    const total_mes    = (todas || []).filter(c => c.data_consulta?.startsWith(hoje.slice(0,7))).length
    const aguardando   = (todas || []).filter(c => c.data_consulta === hoje && ['confirmada','triado'].includes(c.status)).length
    const em_andamento = (todas || []).filter(c => c.data_consulta === hoje && c.status === 'em_atendimento').length
    const finalizados  = (todas || []).filter(c => c.data_consulta === hoje && c.status === 'liberada').length
    let qProx = supabase.from('consultas')
      .select('id, horario, status, motivo, paciente_id')
      .eq('data_consulta', hoje)
      .in('status', ['confirmada','triado','em_atendimento'])
      .order('horario', { ascending: true })
      .limit(5)
    if (medico_id) qProx = qProx.eq('medico_id', medico_id)
    if (req.usuario.clinica_id) qProx = qProx.eq('clinica_id', req.usuario.clinica_id)
    const { data: proximas } = await qProx
    res.json({ total_hoje, total_mes, aguardando, em_andamento, finalizados, proximas: proximas || [] })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Agenda ────────────────────────────────────────────────────────────────────
router.get('/agenda', async (req, res) => {
  try {
    const medico_id = await getMedicoId(req)
    const { data: param, mes } = req.query
    let q = supabase.from('consultas')
      .select('*')
      .order('data_consulta', { ascending: true })
      .order('horario',       { ascending: true })
    if (medico_id) q = q.eq('medico_id', medico_id)
    if (req.usuario.clinica_id) q = q.eq('clinica_id', req.usuario.clinica_id)
    if (param) q = q.eq('data_consulta', param)
    else if (mes) {
      q = q.gte('data_consulta', `${mes}-01`)
           .lte('data_consulta', `${mes}-31`)
    }
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || [])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Buscar consulta por ID ─────────────────────────────────────────────────────
router.get('/consulta/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!id || !uuidRegex.test(id))
      return res.status(400).json({ error: 'ID de consulta inválido.' })
    const medico_id = await getMedicoId(req)
    let q = supabase.from('consultas').select('*').eq('id', id)
    if (medico_id && uuidRegex.test(medico_id)) q = q.eq('medico_id', medico_id)
    const { data, error } = await q.maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    if (!data)  return res.status(404).json({ error: 'Consulta não encontrada.' })
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Buscar paciente por ID ────────────────────────────────────────────────────
router.get('/paciente/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!id || !uuidRegex.test(id))
      return res.status(400).json({ error: 'ID de paciente inválido.' })
    const { data, error } = await supabase
      .from('pacientes').select('*').eq('id', id).maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || null)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Triagem ───────────────────────────────────────────────────────────────────
router.get('/triagem', async (req, res) => {
  try {
    const medico_id = await getMedicoId(req)
    const hoje = req.query.data || new Date().toISOString().split('T')[0]
    let q = supabase.from('consultas')
      .select('*')
      .eq('data_consulta', hoje)
      .in('status', ['triado', 'em_atendimento'])
      .order('horario', { ascending: true })
    if (medico_id) q = q.eq('medico_id', medico_id)
    if (req.usuario.clinica_id) q = q.eq('clinica_id', req.usuario.clinica_id)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || [])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Iniciar atendimento ───────────────────────────────────────────────────────
router.post('/atendimento/:consulta_id/iniciar', async (req, res) => {
  try {
    const { error } = await supabase.from('consultas')
      .update({ status: 'em_atendimento' })
      .eq('id', req.params.consulta_id)
    if (error) return res.status(400).json({ error: error.message })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Finalizar atendimento (prontuário) ────────────────────────────────────────
router.post('/atendimento/:consulta_id/finalizar', async (req, res) => {
  try {
    const medico_id = await getMedicoId(req)
    const { anamnese, exame_fisico, diagnostico, cid10, conduta, prescricao, retorno_dias, observacoes } = req.body
    const { data: consulta } = await supabase
      .from('consultas').select('paciente_id, clinica_id').eq('id', req.params.consulta_id).single()
    if (!consulta) return res.status(404).json({ error: 'Consulta não encontrada.' })
    const descricao = gerarDescricao({ diagnostico, anamnese, conduta })
    const { data: pront, error: ep } = await supabase.from('prontuarios')
      .upsert([{
        consulta_id:      req.params.consulta_id,
        paciente_id:      consulta.paciente_id,
        medico_id,
        clinica_id:       consulta.clinica_id || req.usuario.clinica_id,
        descricao,
        anamnese,
        exame_fisico,
        diagnostico,
        cid10,
        conduta,
        prescricao,
        retorno_dias:     retorno_dias || null,
        observacoes,
        data_atendimento: new Date().toISOString().split('T')[0],
      }], { onConflict: 'consulta_id' })
      .select()
    if (ep) return res.status(400).json({ error: ep.message })
    await supabase.from('consultas').update({ status: 'liberada' }).eq('id', req.params.consulta_id)
    await registrarLog({
      usuario: req.usuario, acao: 'criar', tabela: 'prontuarios',
      registro_id: pront[0]?.id,
      detalhes: { consulta_id: req.params.consulta_id, diagnostico },
    })
    res.status(201).json(pront[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Buscar prontuário existente ───────────────────────────────────────────────
router.get('/atendimento/:consulta_id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('prontuarios')
      .select('*').eq('consulta_id', req.params.consulta_id).maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || null)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Histórico ─────────────────────────────────────────────────────────────────
router.get('/historico', async (req, res) => {
  try {
    const medico_id = await getMedicoId(req)
    let q = supabase.from('prontuarios')
      .select('*, consultas(data_consulta, horario, motivo, status)')
      .order('data_atendimento', { ascending: false })
      .limit(50)
    if (medico_id) q = q.eq('medico_id', medico_id)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || [])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Criar usuário para médico ─────────────────────────────────────────────────
router.post('/criar-usuario', async (req, res) => {
  try {
    const { medico_id, email, senha } = req.body
    if (!medico_id || !email || !senha)
      return res.status(400).json({ error: 'medico_id, email e senha são obrigatórios.' })
    const { data: medico } = await supabase.from('medicos').select('*').eq('id', medico_id).single()
    if (!medico) return res.status(404).json({ error: 'Médico não encontrado.' })
    if (medico.usuario_id) return res.status(400).json({ error: 'Médico já possui usuário vinculado.' })
    const { data: emailEx } = await supabase.from('usuarios').select('id').eq('email', email).limit(1)
    if (emailEx?.length > 0) return res.status(409).json({ error: 'E-mail já cadastrado.' })
    const senha_hash = await bcrypt.hash(senha, 10)
    const { data: usuario, error: eu } = await supabase.from('usuarios').insert([{
      nome:       medico.nome,
      email,
      senha_hash,
      perfil:     'medico',
      clinica_id: medico.clinica_id,
      status:     'pendente',
    }]).select().single()
    if (eu) return res.status(400).json({ error: eu.message })
    await supabase.from('medicos').update({ usuario_id: usuario.id, email }).eq('id', medico_id)
    await registrarLog({
      usuario: req.usuario, acao: 'criar', tabela: 'usuarios',
      registro_id: usuario.id,
      detalhes: { perfil: 'medico', medico_id, email },
    })
    res.status(201).json({ ok: true, usuario_id: usuario.id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENTOS MÉDICOS
// ════════════════════════════════════════════════════════════════════════════

// ── POST /medico/documento — Cria documento ───────────────────────────────────
router.post('/documento', async (req, res) => {
  try {
    const { tipo, consulta_id, dados } = req.body

    if (!tipo || !TIPOS_DOCUMENTO.includes(tipo))
      return res.status(400).json({ error: `Tipo inválido. Permitidos: ${TIPOS_DOCUMENTO.join(', ')}` })
    if (!consulta_id)
      return res.status(400).json({ error: 'consulta_id é obrigatório.' })
    if (!dados || typeof dados !== 'object')
      return res.status(400).json({ error: 'Dados do documento são obrigatórios.' })

    const medico_id = await getMedicoId(req)
    if (!medico_id)
      return res.status(400).json({ error: 'Médico não encontrado para o usuário autenticado.' })

    const { data, error } = await supabase
      .from('documentos_medicos')
      .insert([{
        id:          crypto.randomUUID(),
        tipo,
        consulta_id,
        medico_id,
        dados,
        status:      'pendente_assinatura',
      }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })

    await registrarLog({
      usuario: req.usuario, acao: 'criar', tabela: 'documentos_medicos',
      registro_id: data.id,
      detalhes: { tipo, consulta_id },
    })

    res.status(201).json({
      id:          data.id,
      tipo:        data.tipo,
      status:      data.status,
      arquivo_pdf: data.arquivo_pdf || null,
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── GET /medico/documento/consulta/:consultaId — Lista por consulta ───────────
router.get('/documento/consulta/:consultaId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documentos_medicos')
      .select('id, tipo, status, arquivo_pdf, created_at')
      .eq('consulta_id', req.params.consultaId)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || [])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── GET /medico/documento/:id — Detalhes ──────────────────────────────────────
router.get('/documento/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documentos_medicos')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    if (!data)  return res.status(404).json({ error: 'Documento não encontrado.' })
    const medico_id = await getMedicoId(req)
    if (data.medico_id !== medico_id)
      return res.status(403).json({ error: 'Acesso negado.' })
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
