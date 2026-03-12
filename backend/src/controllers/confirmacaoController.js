import crypto from 'crypto'
import { supabase } from '../../lib/supabase.js'

/**
 * POST /api/confirmacao/gerar
 * Gera um token único para confirmação de consulta por e-mail
 * Body: { consulta_id }
 * Retorna: { token }
 */
export const gerarToken = async (req, res) => {
  try {
    const { consulta_id } = req.body
    if (!consulta_id) return res.status(400).json({ error: 'consulta_id é obrigatório.' })

    // Verifica se a consulta existe
    const { data: consulta, error: errConsulta } = await supabase
      .from('consultas').select('id, status').eq('id', consulta_id).single()
    if (errConsulta || !consulta) return res.status(404).json({ error: 'Consulta não encontrada.' })

    // Remove tokens antigos da mesma consulta
    await supabase.from('consulta_tokens').delete().eq('consulta_id', consulta_id)

    const token   = crypto.randomBytes(32).toString('hex')
    const expiraEm = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 horas

    const { error } = await supabase.from('consulta_tokens').insert([{ consulta_id, token, expira_em: expiraEm }])
    if (error) throw new Error(error.message)

    res.json({ token })
  } catch (err) {
    console.error('[Confirmação] Erro ao gerar token:', err.message)
    res.status(500).json({ error: err.message })
  }
}

/**
 * GET /api/confirmacao/:token
 * Valida o token e confirma a consulta
 * Retorna os dados da consulta confirmada
 */
export const confirmarPorToken = async (req, res) => {
  try {
    const { token } = req.params

    const { data: registro, error } = await supabase
      .from('consulta_tokens')
      .select('consulta_id, expira_em, usado')
      .eq('token', token)
      .single()

    if (error || !registro) return res.status(404).json({ error: 'Link inválido ou expirado.' })
    if (registro.usado)     return res.status(410).json({ error: 'Este link já foi utilizado.', jaConfirmado: true })
    if (new Date(registro.expira_em) < new Date()) {
      return res.status(410).json({ error: 'Este link expirou. Solicite um novo e-mail de confirmação.' })
    }

    // Busca dados completos da consulta
    const { data: consulta } = await supabase
      .from('consultas')
      .select('id, status, data_consulta, horario, motivo, paciente_id, medico_id, clinica_id')
      .eq('id', registro.consulta_id)
      .single()

    if (consulta.status === 'confirmada') {
      await supabase.from('consulta_tokens').update({ usado: true }).eq('token', token)
      return res.json({ success: true, jaConfirmado: true, consulta })
    }

    // Atualiza status para confirmada
    await supabase.from('consultas').update({ status: 'confirmada' }).eq('id', registro.consulta_id)

    // Marca token como usado
    await supabase.from('consulta_tokens').update({ usado: true }).eq('token', token)

    const consultaAtualizada = { ...consulta, status: 'confirmada' }
    res.json({ success: true, jaConfirmado: false, consulta: consultaAtualizada })
  } catch (err) {
    console.error('[Confirmação] Erro ao confirmar:', err.message)
    res.status(500).json({ error: err.message })
  }
}
