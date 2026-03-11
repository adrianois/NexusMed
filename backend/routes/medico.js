/**
 * /medico — rotas exclusivas do perfil 'medico'
 * Dashboard, agenda própria, triagem dos pacientes do médico,
 * atendimentos (prontuários vinculados ao médico)
 */
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

// Middleware: garante que só médico (ou admin/gestor) acessa
router.use((req, res, next) => {
  const permitidos = ['medico', 'gestor', 'admin', 'normal']
  if (!permitidos.includes(req.usuario.perfil))
    return res.status(403).json({ error: 'Acesso restrito.' })
  next()
})

// ─── helper: resolve medico_id do usuário logado ────────────────────────────
async function getMedicoId(req) {
  if (req.usuario.perfil === 'medico') {
    const { data } = await supabase
      .from('medicos')
      .select('id')
      .eq('usuario_id', req.usuario.id)
      .single()
    return data?.id || null
  }
  // admin/gestor/normal pode passar ?medico_id=X
  return req.query.medico_id || null
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
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

    // Próximas consultas (hoje, ordenadas por horário)
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

// ─── Agenda (consultas do médico) ────────────────────────────────────────────
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

// ─── Fila de triagem (pacientes triados aguardando o médico) ─────────────────
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

// ─── Iniciar atendimento ──────────────────────────────────────────────────────
router.post('/atendimento/:consulta_id/iniciar', async (req, res) => {
  try {
    const { error } = await supabase.from('consultas')
      .update({ status: 'em_atendimento' })
      .eq('id', req.params.consulta_id)
    if (error) return res.status(400).json({ error: error.message })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Salvar atendimento (prontuário) ─────────────────────────────────────────
router.post('/atendimento/:consulta_id/finalizar', async (req, res) => {
  try {
    const medico_id = await getMedicoId(req)
    const {
      anamnese, exame_fisico, diagnostico, cid10,
      conduta, prescricao, retorno_dias, observacoes
    } = req.body

    const { data: consulta } = await supabase
      .from('consultas').select('paciente_id, clinica_id').eq('id', req.params.consulta_id).single()
    if (!consulta) return res.status(404).json({ error: 'Consulta não encontrada.' })

    // Upsert no prontuário
    const { data: pront, error: ep } = await supabase.from('prontuarios')
      .upsert([{
        consulta_id:  req.params.consulta_id,
        paciente_id:  consulta.paciente_id,
        medico_id,
        clinica_id:   consulta.clinica_id || req.usuario.clinica_id,
        anamnese, exame_fisico, diagnostico, cid10,
        conduta, prescricao, retorno_dias, observacoes,
        data_atendimento: new Date().toISOString().split('T')[0],
      }], { onConflict: 'consulta_id' })
      .select()
    if (ep) return res.status(400).json({ error: ep.message })

    // Atualiza status da consulta para liberada
    await supabase.from('consultas').update({ status: 'liberada' }).eq('id', req.params.consulta_id)

    await registrarLog({
      usuario: req.usuario, acao: 'criar', tabela: 'prontuarios',
      registro_id: pront[0]?.id,
      detalhes: { consulta_id: req.params.consulta_id, diagnostico }
    })
    res.status(201).json(pront[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Buscar atendimento existente ─────────────────────────────────────────────
router.get('/atendimento/:consulta_id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('prontuarios')
      .select('*').eq('consulta_id', req.params.consulta_id).maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || null)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Histórico de atendimentos ────────────────────────────────────────────────
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

// ─── Criar usuário para médico ────────────────────────────────────────────────
router.post('/criar-usuario', async (req, res) => {
  try {
    const { medico_id, email, senha } = req.body
    if (!medico_id || !email || !senha)
      return res.status(400).json({ error: 'medico_id, email e senha são obrigatórios.' })

    const { data: medico } = await supabase.from('medicos').select('*').eq('id', medico_id).single()
    if (!medico) return res.status(404).json({ error: 'Médico não encontrado.' })
    if (medico.usuario_id) return res.status(400).json({ error: 'Médico já possui usuário vinculado.' })

    const hash = await bcrypt.hash(senha, 10)
    const { data: usuario, error: eu } = await supabase.from('usuarios').insert([{
      nome:      medico.nome,
      email,
      senha:     hash,
      perfil:    'medico',
      clinica_id: medico.clinica_id,
      aprovado:  true,
      ativo:     true,
    }]).select().single()
    if (eu) return res.status(400).json({ error: eu.message })

    await supabase.from('medicos').update({ usuario_id: usuario.id, email }).eq('id', medico_id)

    await registrarLog({
      usuario: req.usuario, acao: 'criar', tabela: 'usuarios',
      registro_id: usuario.id,
      detalhes: { perfil: 'medico', medico_id, email }
    })
    res.status(201).json({ ok: true, usuario_id: usuario.id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
