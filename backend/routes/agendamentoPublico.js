import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { normalizarData } from '../lib/utils.js'

const router = Router()

// GET /agendamento-publico/clinicas
router.get('/clinicas', async (_req, res) => {
  const { data, error } = await supabase
    .from('clinicas')
    .select('id, nome, cidade, uf')
    .eq('ativo', true)
    .order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// GET /agendamento-publico/medicos?clinica_id=
router.get('/medicos', async (req, res) => {
  const { clinica_id } = req.query
  if (!clinica_id) return res.status(400).json({ error: 'clinica_id é obrigatório.' })
  const { data, error } = await supabase
    .from('medicos')
    .select('id, nome, especialidade')
    .eq('clinica_id', clinica_id)
    .eq('ativo', true)
    .order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// GET /agendamento-publico/horarios?medico_id=&data=
router.get('/horarios', async (req, res) => {
  const { medico_id, data } = req.query
  if (!medico_id || !data) return res.status(400).json({ error: 'medico_id e data são obrigatórios.' })

  // Busca horários já ocupados
  const { data: ocupados } = await supabase
    .from('consultas')
    .select('horario')
    .eq('medico_id', medico_id)
    .eq('data_consulta', normalizarData(data))
    .in('status', ['agendada', 'confirmada', 'em_triagem', 'triado'])

  const horariosOcupados = (ocupados || []).map(c => c.horario)

  // Grade padrão 08:00 às 17:30 de 30 em 30 min
  const grade = []
  for (let h = 8; h < 18; h++) {
    for (let m of [0, 30]) {
      if (h === 17 && m === 30) break
      const horario = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      grade.push({ horario, disponivel: !horariosOcupados.includes(horario) })
    }
  }
  res.json(grade)
})

// POST /agendamento-publico/agendar
router.post('/agendar', async (req, res) => {
  const { clinica_id, medico_id, data_consulta, horario, motivo, nome_paciente, telefone, email } = req.body

  if (!clinica_id || !medico_id || !data_consulta || !horario || !motivo || !nome_paciente)
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' })

  // Verifica se horário ainda está disponível
  const { data: conflito } = await supabase
    .from('consultas')
    .select('id')
    .eq('medico_id', medico_id)
    .eq('data_consulta', normalizarData(data_consulta))
    .eq('horario', horario)
    .in('status', ['agendada', 'confirmada', 'em_triagem', 'triado'])
    .limit(1)

  if (conflito?.length > 0)
    return res.status(409).json({ error: 'Este horário não está mais disponível. Escolha outro.' })

  // Busca ou cria paciente pelo telefone/email
  let paciente_id = null
  if (telefone) {
    const { data: pacExistente } = await supabase
      .from('pacientes')
      .select('id')
      .eq('clinica_id', clinica_id)
      .eq('telefone', telefone)
      .limit(1)

    if (pacExistente?.length > 0) {
      paciente_id = pacExistente[0].id
    } else {
      const { data: novoPac } = await supabase
        .from('pacientes')
        .insert([{ nome: nome_paciente, telefone, email: email || null, clinica_id }])
        .select('id')
      paciente_id = novoPac?.[0]?.id || null
    }
  }

  const { data, error } = await supabase
    .from('consultas')
    .insert([{
      paciente_id,
      medico_id,
      clinica_id,
      data_consulta: normalizarData(data_consulta),
      horario,
      motivo,
      observacoes: `Agendamento online — Paciente: ${nome_paciente}${telefone ? ` | Tel: ${telefone}` : ''}${email ? ` | Email: ${email}` : ''}`,
      status: 'agendada',
    }])
    .select()

  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json({ success: true, consulta_id: data[0].id, mensagem: 'Agendamento realizado com sucesso! A clínica entrará em contato para confirmar.' })
})

export default router
