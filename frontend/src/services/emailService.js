import api from '../api'

export const enviarEmailConsulta = async ({ para, paciente, clinica_id, medico, data, hora, consulta_id }) => {
  const response = await api.post('/api/email/confirm-appointment', {
    para, paciente, clinica_id, medico, data, hora, consulta_id,
  })
  return response.data
}
