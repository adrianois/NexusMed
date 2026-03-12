import {
  sendTextMessage,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
} from '../services/whatsappService.js';

// Extrai mensagem de erro legível da resposta da Meta API
const extrairErro = (err) => {
  const data = err.response?.data
  if (!data) return err.message
  // Erro padrão da Meta: { error: { message, type, code } }
  if (data?.error?.message) return `Meta API: ${data.error.message} (código ${data.error.code})`
  if (typeof data === 'string') return data
  return JSON.stringify(data)
}

export const verifyWebhook = (req, res) => {
  const mode      = req.query['hub.mode']
  const token     = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verificado com sucesso.')
    return res.status(200).send(challenge)
  }
  console.warn('[WhatsApp] Falha na verificação do webhook.')
  res.sendStatus(403)
}

export const receiveWebhook = async (req, res) => {
  const body = req.body
  if (body.object !== 'whatsapp_business_account') return res.sendStatus(404)
  const messages = body.entry?.[0]?.changes?.[0]?.value?.messages
  if (messages?.length) {
    const msg  = messages[0]
    const from = msg.from
    const text = msg.text?.body?.trim().toUpperCase()
    console.log(`[WhatsApp] Mensagem de ${from}: ${msg.text?.body}`)
    if (text === 'CANCELAR') {
      await sendTextMessage(from, '❌ Recebemos seu pedido de cancelamento. Em breve nossa equipe entrará em contato para confirmar.')
    }
  }
  res.sendStatus(200)
}

export const notifyPatient = async (req, res) => {
  try {
    const { phone, message } = req.body
    if (!phone || !message) return res.status(400).json({ error: 'phone e message são obrigatórios.' })
    const result = await sendTextMessage(phone, message)
    res.json({ success: true, result })
  } catch (err) {
    const msg = extrairErro(err)
    console.error('[WhatsApp] Erro ao enviar mensagem:', msg)
    res.status(500).json({ error: msg })
  }
}

export const confirmAppointment = async (req, res) => {
  try {
    const { phone, paciente, data, hora, medico, clinica } = req.body
    if (!phone || !paciente || !data || !hora || !medico) {
      return res.status(400).json({ error: 'Campos obrigatórios: phone, paciente, data, hora, medico.' })
    }
    console.log(`[WhatsApp] Enviando confirmação para ${phone} (${paciente})`)
    const result = await sendAppointmentConfirmation(phone, paciente, data, hora, medico, clinica)
    res.json({ success: true, result })
  } catch (err) {
    const msg = extrairErro(err)
    console.error('[WhatsApp] Erro ao confirmar consulta:', msg)
    res.status(500).json({ error: msg })
  }
}

export const remindAppointment = async (req, res) => {
  try {
    const { phone, paciente, data, hora } = req.body
    if (!phone || !paciente || !data || !hora) {
      return res.status(400).json({ error: 'Campos obrigatórios: phone, paciente, data, hora.' })
    }
    const result = await sendAppointmentReminder(phone, paciente, data, hora)
    res.json({ success: true, result })
  } catch (err) {
    const msg = extrairErro(err)
    console.error('[WhatsApp] Erro ao enviar lembrete:', msg)
    res.status(500).json({ error: msg })
  }
}
