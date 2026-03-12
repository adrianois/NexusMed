import axios from 'axios';

const getBaseURL = () =>
  `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  'Content-Type': 'application/json',
});

/**
 * Envia mensagem de texto simples via WhatsApp
 * @param {string} to - Número do destinatário com DDI (ex: 5567999999999)
 * @param {string} text - Texto da mensagem
 */
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

/**
 * Envia mensagem usando template aprovado pela Meta
 * @param {string} to - Número do destinatário com DDI
 * @param {string} templateName - Nome do template aprovado
 * @param {string} langCode - Código do idioma (padrão: pt_BR)
 * @param {Array} components - Parâmetros do template
 */
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

/**
 * Envia confirmação de consulta agendada
 * @param {string} to - Telefone do paciente
 * @param {string} paciente - Nome do paciente
 * @param {string} data - Data da consulta (ex: 15/03/2026)
 * @param {string} hora - Hora da consulta (ex: 14:30)
 * @param {string} medico - Nome do médico
 */
export const sendAppointmentConfirmation = async (to, paciente, data, hora, medico) => {
  const text =
    `✅ *Consulta Confirmada - NexusMed*\n\n` +
    `Olá, ${paciente}! Sua consulta foi agendada com sucesso.\n\n` +
    `👨‍⚕️ *Médico:* ${medico}\n` +
    `📅 *Data:* ${data}\n` +
    `🕐 *Hora:* ${hora}\n\n` +
    `Para cancelar, responda *CANCELAR*.\n` +
    `_NexusMed - Cuidando de você._`;
  return sendTextMessage(to, text);
};

/**
 * Envia lembrete de consulta (24h antes)
 * @param {string} to - Telefone do paciente
 * @param {string} paciente - Nome do paciente
 * @param {string} data - Data da consulta
 * @param {string} hora - Hora da consulta
 */
export const sendAppointmentReminder = async (to, paciente, data, hora) => {
  const text =
    `🔔 *Lembrete de Consulta - NexusMed*\n\n` +
    `Olá, ${paciente}! Lembramos que você tem uma consulta amanhã.\n\n` +
    `📅 *Data:* ${data}\n` +
    `🕐 *Hora:* ${hora}\n\n` +
    `Para cancelar, responda *CANCELAR*.`;
  return sendTextMessage(to, text);
};
