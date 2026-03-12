import api from '../api'

/**
 * Envia e-mail de confirmação de consulta ao paciente
 */
export const enviarEmailConsulta = async ({ para, paciente, clinica, medico, data, hora }) => {
  const response = await api.post('/api/email/confirm-appointment', {
    para, paciente, clinica, medico, data, hora,
  })
  return response.data
}
