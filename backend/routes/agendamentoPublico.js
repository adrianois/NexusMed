import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { normalizarData } from '../lib/utils.js'
import { autenticar } from '../lib/auth.js'

const router = Router()

// Data placeholder usada quando paciente externo não informa data de nascimento
const DATA_NASC_PLACEHOLDER = '1900-01-01'

// ── ROTAS PÚBLICAS (sem autenticação) ────────────────────────────────────────

router.get('/clinicas', async (_req, res) => {
  const { data, error } = await supabase
    .from('clinicas').select('id, nome, cidade').eq('ativo', true).order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

router.get('/medicos', async (req, res) => {
  const { clinica_id } = req.query
  if (!clinica_id) return res.status(400).json({ error: 'clinica_id é obrigatório.' })
  const { data, error } = await supabase
    .from('medicos').select('id, nome, especialidade')
    .eq('clinica_id', clinica_id).eq('ativo', true).order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

router.get('/horarios', async (req, res) => {
  const { medico_id, data } = req.query
  if (!medico_id || !data) return res.status(400).json({ error: 'medico_id e data são obrigatórios.' })
  const { data: ocupados } = await supabase
    .from('consultas').select('horario')
    .eq('medico_id', medico_id).eq('data_consulta', normalizarData(data))
    .in('status', ['agendada', 'confirmada', 'em_triagem', 'triado'])
  const horariosOcupados = (ocupados || []).map(c => c.horario)
  const grade = []
  for (let h = 8; h < 18; h++) {
    for (let m of [0, 30]) {
      if (h === 17 && m === 30) break
      const horario = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
      grade.push({ horario, disponivel: !horariosOcupados.includes(horario) })
    }
  }
  res.json(grade)
})

// Busca paciente por CPF para sugerir vínculo
router.get('/buscar-paciente', async (req, res) => {
  const { cpf, clinica_id } = req.query
  if (!cpf || !clinica_id) return res.status(400).json({ error: 'cpf e clinica_id são obrigatórios.' })
  const cpfLimpo = cpf.replace(/\D/g, '')
  const { data } = await supabase
    .from('pacientes').select('id, nome, telefone, email, cpf')
    .eq('clinica_id', clinica_id)
    .or(`cpf.eq.${cpf},cpf.eq.${cpfLimpo}`)
    .limit(1)
  if (data?.length > 0) return res.json({ encontrado: true, paciente: data[0] })
  res.json({ encontrado: false })
})

// Agendamento público — cria paciente automaticamente se não existir
router.post('/agendar', async (req, res) => {
  const { clinica_id, medico_id, data_consulta, horario, motivo,
          nome_paciente, telefone, email, cpf, data_nascimento } = req.body

  if (!clinica_id || !medico_id || !data_consulta || !horario || !motivo || !nome_paciente)
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' })

  // Verifica conflito de horário
  const { data: conflito } = await supabase
    .from('consultas').select('id')
    .eq('medico_id', medico_id).eq('data_consulta', normalizarData(data_consulta))
    .eq('horario', horario).in('status', ['agendada', 'confirmada', 'em_triagem', 'triado'])
    .limit(1)
  if (conflito?.length > 0)
    return res.status(409).json({ error: 'Este horário não está mais disponível. Escolha outro.' })

  // Busca paciente existente por CPF ou telefone
  let paciente_id = null
  const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null
  const telLimpo = telefone ? telefone.replace(/\D/g, '') : null

  if (cpfLimpo) {
    const { data: porCpf } = await supabase
      .from('pacientes').select('id')
      .eq('clinica_id', clinica_id)
      .or(`cpf.eq.${cpf},cpf.eq.${cpfLimpo}`)
      .limit(1)
    if (porCpf?.length > 0) paciente_id = porCpf[0].id
  }

  if (!paciente_id && telLimpo) {
    const { data: porTel } = await supabase
      .from('pacientes').select('id')
      .eq('clinica_id', clinica_id).eq('telefone', telLimpo).limit(1)
    if (porTel?.length > 0) paciente_id = porTel[0].id
  }

  // Cria paciente novo se não encontrou
  if (!paciente_id) {
    const novoPac = {
      nome: nome_paciente,
      clinica_id,
      // data_nascimento é NOT NULL no banco — usa placeholder se não informada
      data_nascimento: data_nascimento || DATA_NASC_PLACEHOLDER,
    }
    if (telLimpo) novoPac.telefone = telLimpo
    if (email)    novoPac.email    = email
    if (cpfLimpo) novoPac.cpf      = cpfLimpo

    const { data: criado, error: erroPac } = await supabase
      .from('pacientes').insert([novoPac]).select('id')
    if (erroPac) return res.status(400).json({ error: `Erro ao criar paciente: ${erroPac.message}` })
    paciente_id = criado[0].id
  }

  const { data, error } = await supabase.from('consultas').insert([{
    paciente_id, medico_id, clinica_id,
    data_consulta: normalizarData(data_consulta), horario, motivo,
    observacoes: `Agendamento online — ${nome_paciente}${telefone ? ` | Tel: ${telefone}` : ''}${email ? ` | Email: ${email}` : ''}`,
    status: 'agendada',
  }]).select()

  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json({
    success: true,
    consulta_id: data[0].id,
    paciente_id,
    mensagem: 'Agendamento realizado com sucesso! A clínica entrará em contato para confirmar.'
  })
})

// ── ROTAS INTERNAS (com autenticação) ────────────────────────────────────────

router.get('/pendentes-vinculo', autenticar, async (req, res) => {
  const { clinica_id } = req.usuario
  let q = supabase.from('consultas').select('*')
    .is('paciente_id', null).eq('status', 'agendada').order('data_consulta')
  if (clinica_id) q = q.eq('clinica_id', clinica_id)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

router.get('/sugerir-paciente', autenticar, async (req, res) => {
  const { termo, clinica_id: qClinica } = req.query
  const clinica_id = req.usuario.perfil !== 'admin' ? req.usuario.clinica_id : qClinica
  if (!termo) return res.status(400).json({ error: 'termo é obrigatório.' })
  const { data } = await supabase
    .from('pacientes').select('id, nome, cpf, telefone, email')
    .eq('clinica_id', clinica_id)
    .or(`nome.ilike.%${termo}%,cpf.ilike.%${termo}%,telefone.ilike.%${termo}%`)
    .order('nome').limit(10)
  res.json(data || [])
})

router.patch('/vincular/:consulta_id', autenticar, async (req, res) => {
  const { paciente_id } = req.body
  if (!paciente_id) return res.status(400).json({ error: 'paciente_id é obrigatório.' })
  const { data, error } = await supabase
    .from('consultas').update({ paciente_id })
    .eq('id', req.params.consulta_id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

router.post('/criar-e-vincular/:consulta_id', autenticar, async (req, res) => {
  const { nome, cpf, telefone, email, data_nascimento } = req.body
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' })
  const clinica_id = req.usuario.clinica_id
  const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null
  const telLimpo = telefone ? telefone.replace(/\D/g, '') : null

  const novoPac = {
    nome,
    clinica_id,
    data_nascimento: data_nascimento || DATA_NASC_PLACEHOLDER,
  }
  if (cpfLimpo) novoPac.cpf      = cpfLimpo
  if (telLimpo) novoPac.telefone = telLimpo
  if (email)    novoPac.email    = email

  const { data: pac, error: erroPac } = await supabase
    .from('pacientes').insert([novoPac]).select()
  if (erroPac) return res.status(400).json({ error: erroPac.message })

  const { data: consulta, error: erroConsulta } = await supabase
    .from('consultas').update({ paciente_id: pac[0].id })
    .eq('id', req.params.consulta_id).select()
  if (erroConsulta) return res.status(400).json({ error: erroConsulta.message })

  res.status(201).json({ paciente: pac[0], consulta: consulta[0] })
})

export default router
