import { enviarEmailConsulta } from '../services/emailService.js'
import crypto from 'crypto'
import { supabase } from '../../lib/supabase.js'

const gerarTokenConfirmacao = async (consulta_id) => {
  await supabase.from('consulta_tokens').delete().eq('consulta_id', consulta_id)
  const token    = crypto.randomBytes(32).toString('hex')
  const expiraEm = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('consulta_tokens').insert([{ consulta_id, token, expira_em: expiraEm, usado: false }])
  if (error) throw new Error('Erro ao gerar token: ' + error.message)
  return token
}

export const sendAppointmentEmail = async (req, res) => {
  try {
    const { para, paciente, clinica, medico, data, hora, consulta_id } = req.body

    if (!para || !paciente || !data || !hora)
      return res.status(400).json({ error: 'Campos obrigatórios: para, paciente, data, hora.' })

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para))
      return res.status(400).json({ error: 'E-mail do destinatário inválido.' })

    // Gera link de confirmação se consulta_id foi enviado
    let linkConfirmacao = null
    if (consulta_id) {
      const token   = await gerarTokenConfirmacao(consulta_id)
      const baseUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:5173'
      linkConfirmacao = `${baseUrl}/confirmar-consulta?token=${token}`
    }

    console.log(`[Email] Enviando para ${para} (${paciente}) — link: ${linkConfirmacao}`)

    await enviarEmailConsulta({
      para, paciente,
      clinica: clinica || 'NexusMed',
      medico:  medico  || 'A definir',
      data, hora,
      linkConfirmacao,
    })

    res.json({ success: true, message: `E-mail enviado para ${para}` })
  } catch (err) {
    console.error('[Email] Erro ao enviar:', err.message)
    res.status(500).json({ error: err.message })
  }
}
