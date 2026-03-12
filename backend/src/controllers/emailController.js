import { enviarEmailConsulta } from '../services/emailService.js'
import crypto from 'crypto'
import { supabase } from '../../lib/supabase.js'

const gerarTokenConfirmacao = async (consulta_id) => {
  await supabase.from('consulta_tokens').delete().eq('consulta_id', consulta_id)
  const token    = crypto.randomBytes(32).toString('hex')
  const expiraEm = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('consulta_tokens')
    .insert([{ consulta_id, token, expira_em: expiraEm, usado: false }])
  if (error) throw new Error('Erro ao gerar token: ' + error.message)
  return token
}

/**
 * Resolve a URL base do frontend de forma inteligente:
 * 1. FRONTEND_URL no .env (sem localhost) → usa diretamente
 * 2. Codespaces: detecta pelo HOST do request → troca porta 4000 → 5173
 * 3. Fallback → localhost:5173
 */
const resolverFrontendUrl = (req) => {
  const envUrl = process.env.FRONTEND_URL || ''

  // Se FRONTEND_URL estiver definida e não for localhost, usa ela
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.split(',')[0].trim()
  }

  // Tenta detectar pelo header do request (Codespaces / proxy)
  const host   = req.headers['x-forwarded-host'] || req.headers.host || ''
  const proto  = req.headers['x-forwarded-proto'] || 'https'

  // Codespaces: host fica tipo "username-repo-4000.app.github.dev"
  if (host.includes('app.github.dev')) {
    // Substitui a porta do backend (4000) pela do frontend (5173)
    const frontendHost = host.replace(/-4000\.app\.github\.dev/, '-5173.app.github.dev')
                             .replace(/-3000\.app\.github\.dev/, '-5173.app.github.dev')
    return `${proto}://${frontendHost}`
  }

  return 'http://localhost:5173'
}

export const sendAppointmentEmail = async (req, res) => {
  try {
    const { para, paciente, clinica, medico, data, hora, consulta_id } = req.body

    if (!para || !paciente || !data || !hora)
      return res.status(400).json({ error: 'Campos obrigatórios: para, paciente, data, hora.' })

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para))
      return res.status(400).json({ error: 'E-mail do destinatário inválido.' })

    let linkConfirmacao = null
    if (consulta_id) {
      const token      = await gerarTokenConfirmacao(consulta_id)
      const baseUrl    = resolverFrontendUrl(req)
      linkConfirmacao  = `${baseUrl}/confirmar-consulta?token=${token}`
    }

    console.log(`[Email] Enviando para ${para} | link: ${linkConfirmacao}`)

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
