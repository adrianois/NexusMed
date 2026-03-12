import {
  sendTextMessage,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
} from '../services/whatsappService.js';

/**
 * GET /api/whatsapp/webhook
 * Verificação do webhook exigida pela Meta
 */
export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verificado com sucesso.');
    return res.status(200).send(challenge);
  }
  console.warn('[WhatsApp] Falha na verificação do webhook.');
  res.sendStatus(403);
};

/**
 * POST /api/whatsapp/webhook
 * Recebe mensagens e eventos do WhatsApp
 */
export const receiveWebhook = async (req, res) => {
  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    return res.sendStatus(404);
  }

  const changes = body.entry?.[0]?.changes?.[0]?.value;
  const messages = changes?.messages;

  if (messages?.length) {
    const msg = messages[0];
    const from = msg.from;
    const text = msg.text?.body?.trim().toUpperCase();

    console.log(`[WhatsApp] Mensagem de ${from}: ${msg.text?.body}`);

    // Resposta automática ao cancelamento
    if (text === 'CANCELAR') {
      await sendTextMessage(
        from,
        '❌ Recebemos seu pedido de cancelamento. Em breve nossa equipe entrará em contato para confirmar. Dúvidas: ligue para nossa central.'
      );
    }
    // Aqui você pode adicionar mais lógicas: salvar mensagem no BD, acionar serviços, etc.
  }

  res.sendStatus(200);
};

/**
 * POST /api/whatsapp/notify
 * Envia mensagem de texto avulsa para um número
 * Body: { phone, message }
 */
export const notifyPatient = async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'phone e message são obrigatórios.' });
    }
    const result = await sendTextMessage(phone, message);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

/**
 * POST /api/whatsapp/confirm-appointment
 * Envia confirmação de consulta agendada
 * Body: { phone, paciente, data, hora, medico }
 */
export const confirmAppointment = async (req, res) => {
  try {
    const { phone, paciente, data, hora, medico } = req.body;
    if (!phone || !paciente || !data || !hora || !medico) {
      return res.status(400).json({ error: 'Campos obrigatórios: phone, paciente, data, hora, medico.' });
    }
    const result = await sendAppointmentConfirmation(phone, paciente, data, hora, medico);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[WhatsApp] Erro ao confirmar consulta:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

/**
 * POST /api/whatsapp/reminder
 * Envia lembrete de consulta
 * Body: { phone, paciente, data, hora }
 */
export const remindAppointment = async (req, res) => {
  try {
    const { phone, paciente, data, hora } = req.body;
    if (!phone || !paciente || !data || !hora) {
      return res.status(400).json({ error: 'Campos obrigatórios: phone, paciente, data, hora.' });
    }
    const result = await sendAppointmentReminder(phone, paciente, data, hora);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar lembrete:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
};
