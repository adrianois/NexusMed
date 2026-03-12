import api from '../api'

/**
 * Envia confirmação de consulta via WhatsApp Business Cloud API
 * Chama POST /api/whatsapp/confirm-appointment no backend
 *
 * @param {string} phone   - Telefone do paciente com DDI, apenas números (ex: 5567999990000)
 * @param {string} paciente - Nome do paciente
 * @param {string} data    - Data formatada (ex: 15/03/2026)
 * @param {string} hora    - Hora da consulta (ex: 14:30)
 * @param {string} medico  - Nome do médico
 * @param {string} clinica - Nome da clínica
 */
export const enviarConfirmacaoWhatsApp = async ({ phone, paciente, data, hora, medico, clinica }) => {
  const response = await api.post('/api/whatsapp/confirm-appointment', {
    phone,
    paciente,
    data,
    hora,
    medico,
    clinica,
  })
  return response.data
}
