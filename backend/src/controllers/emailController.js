import { enviarEmailConsulta } from '../services/emailService.js'

export const sendAppointmentEmail = async (req, res) => {
  try {
    const { para, paciente, clinica, medico, data, hora } = req.body

    if (!para || !paciente || !data || !hora) {
      return res.status(400).json({ error: 'Campos obrigatórios: para, paciente, data, hora.' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para)) {
      return res.status(400).json({ error: 'E-mail do destinatário inválido.' })
    }

    console.log(`[Email] Enviando confirmação para ${para} (${paciente})`)

    await enviarEmailConsulta({ para, paciente, clinica: clinica || 'NexusMed', medico: medico || 'A definir', data, hora })

    res.json({ success: true, message: `E-mail enviado para ${para}` })
  } catch (err) {
    console.error('[Email] Erro ao enviar:', err.message)
    res.status(500).json({ error: err.message })
  }
}
