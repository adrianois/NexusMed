/**
 * useDocumento — Hook que encapsula o envio de um documento ao backend
 * e inicia o fluxo de assinatura GOV.BR.
 */
import { useState } from 'react'
import api from '../../../api'

export function useDocumento() {
  const [salvando,    setSalvando]    = useState(false)
  const [documentoId, setDocumentoId] = useState(null)
  const [erro,        setErro]        = useState(null)

  /**
   * @param {string} tipo - Tipo do documento (ex: 'atestado')
   * @param {string} consultaId
   * @param {object} dados - Dados específicos do documento
   * @returns {string|null} - ID do documento criado
   */
  async function salvarDocumento(tipo, consultaId, dados) {
    setSalvando(true)
    setErro(null)
    try {
      const { data } = await api.post(`/medico/documento`, {
        tipo,
        consulta_id: consultaId,
        dados,
      })
      setDocumentoId(data.id)
      return data.id
    } catch (e) {
      const msg = e.response?.data?.erro || e.response?.data?.error || 'Erro ao salvar documento.'
      setErro(msg)
      return null
    } finally {
      setSalvando(false)
    }
  }

  return { salvando, documentoId, erro, salvarDocumento }
}
