/**
 * /retornos — Painel de acompanhamento de retornos médicos
 *
 * Lógica: quando o médico finaliza um atendimento e preenche
 * "retorno_dias", esse endpoint lista esses prontuários calculando
 * a data prevista do retorno e verificando se já existe nova consulta
 * agendada para o paciente após aquela data.
 */
import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'

const router = Router()
router.use(autenticar)

/**
 * GET /retornos
 * Query params opcionais:
 *   - status: 'pendente' | 'atrasado' | 'agendado'
 *   - busca:  texto para filtrar por nome do paciente
 */
router.get('/', async (req, res) => {
  try {
    const { clinica_id, perfil } = req.usuario
    const { status: filtroStatus, busca } = req.query

    // 1. Busca prontuários que têm retorno_dias preenchido
    let qPront = supabase
      .from('prontuarios')
      .select(`
        id,
        consulta_id,
        paciente_id,
        medico_id,
        diagnostico,
        retorno_dias,
        data_atendimento,
        consultas (id, data_consulta, motivo, horario),
        pacientes (id, nome, telefone),
        medicos   (id, nome, especialidade)
      `)
      .not('retorno_dias', 'is', null)
      .gt('retorno_dias', 0)
      .order('data_atendimento', { ascending: false })

    if (perfil !== 'admin' && clinica_id)
      qPront = qPront.eq('clinica_id', clinica_id)

    const { data: prontuarios, error: ep } = await qPront
    if (ep) return res.status(500).json({ error: ep.message })

    // 2. Para cada prontuário, calcula a data prevista do retorno
    //    e verifica se já existe nova consulta agendada para o paciente
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const resultado = await Promise.all(
      (prontuarios || []).map(async (p) => {
        const dataAtendimento = new Date(p.data_atendimento + 'T12:00:00')
        const dataPrevista    = new Date(dataAtendimento)
        dataPrevista.setDate(dataPrevista.getDate() + Number(p.retorno_dias))

        const dataPrevistaStr = dataPrevista.toISOString().split('T')[0]

        // Verifica se já há consulta posterior ao atendimento original
        let { data: novaConsulta } = await supabase
          .from('consultas')
          .select('id, data_consulta, status')
          .eq('paciente_id', p.paciente_id)
          .gt('data_consulta', p.data_atendimento)
          .neq('id', p.consulta_id)
          .in('status', ['agendada', 'confirmada', 'em_triagem', 'triado', 'liberada'])
          .order('data_consulta', { ascending: true })
          .limit(1)

        const jaAgendado = novaConsulta && novaConsulta.length > 0

        // Calcula status automático
        let statusRetorno
        if (jaAgendado) {
          statusRetorno = 'agendado'
        } else if (dataPrevista < hoje) {
          statusRetorno = 'atrasado'
        } else {
          statusRetorno = 'pendente'
        }

        // Aplica filtro de status se informado
        if (filtroStatus && statusRetorno !== filtroStatus) return null

        // Aplica filtro de busca por nome do paciente
        if (busca) {
          const nome = p.pacientes?.nome || ''
          if (!nome.toLowerCase().includes(busca.toLowerCase())) return null
        }

        return {
          prontuario_id:   p.id,
          consulta_id:     p.consulta_id,
          paciente_id:     p.paciente_id,
          paciente_nome:   p.pacientes?.nome      || '—',
          paciente_tel:    p.pacientes?.telefone   || null,
          medico_nome:     p.medicos?.nome         || '—',
          especialidade:   p.medicos?.especialidade || null,
          diagnostico:     p.diagnostico            || null,
          data_atendimento: p.data_atendimento,
          retorno_dias:    p.retorno_dias,
          data_prevista:   dataPrevistaStr,
          status:          statusRetorno,
          nova_consulta:   jaAgendado ? novaConsulta[0] : null,
          motivo_original: p.consultas?.motivo || null,
        }
      })
    )

    // Remove os nulos (filtrados)
    const filtrados = resultado.filter(Boolean)

    res.json(filtrados)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
