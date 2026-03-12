import axios from 'axios';

const getBaseURL = () =>
  `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  'Content-Type': 'application/json',
});

export const sendTextMessage = async (to, text) => {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };
  const { data } = await axios.post(getBaseURL(), payload, { headers: getHeaders() });
  return data;
};

export const sendTemplateMessage = async (to, templateName, langCode = 'pt_BR', components = []) => {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: langCode },
      components,
    },
  };
  const { data } = await axios.post(getBaseURL(), payload, { headers: getHeaders() });
  return data;
};

export const sendAppointmentConfirmation = async (to, paciente, data, hora, medico, clinica = 'NexusMed') => {
  const text =
    `✅ *Consulta Confirmada - ${clinica}*\n\n` +
    `Olá, ${paciente}! Sua consulta foi agendada com sucesso.\n\n` +
    `🏥 *Clínica:* ${clinica}\n` +
    `👨‍⚕️ *Médico:* ${medico}\n` +
    `📅 *Data:* ${data}\n` +
    `🕐 *Hora:* ${hora}\n\n` +
    `Para cancelar, responda *CANCELAR*.\n` +
    `_${clinica} - Cuidando de você._`;
  return sendTextMessage(to, text);
};

export const sendAppointmentReminder = async (to, paciente, data, hora) => {
  const text =
    `🔔 *Lembrete de Consulta - NexusMed*\n\n` +
    `Olá, ${paciente}! Lembramos que você tem uma consulta amanhã.\n\n` +
    `📅 *Data:* ${data}\n` +
    `🕐 *Hora:* ${hora}\n\n` +
    `Para cancelar, responda *CANCELAR*.`;
  return sendTextMessage(to, text);
};
