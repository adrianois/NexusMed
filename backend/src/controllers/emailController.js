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

const resolverFrontendUrl = (req) => {
  const envUrl = process.env.FRONTEND_URL || ''
  if (envUrl && !envUrl.includes('localhost')) return envUrl.split(',')[0].trim()
  const host  = req.headers['x-forwarded-host'] || req.headers.host || ''
  const proto = req.headers['x-forwarded-proto'] || 'https'
  if (host.includes('app.github.dev')) {
    const frontendHost = host
      .replace(/-4000\.app\.github\.dev/, '-5173.app.github.dev')
      .replace(/-3000\.app\.github\.dev/, '-5173.app.github.dev')
    return `${proto}://${frontendHost}`
  }
  return 'http://localhost:5173'
}

// Busca nome e endereço formatado da clínica no banco
const buscarDadosClinica = async (clinica_id) => {
  if (!clinica_id) return { nome: 'NexusMed', endereco: '' }
  const { data } = await supabase
    .from('clinicas')
    .select('nome, logradouro, numero, complemento, bairro, cidade, estado')
    .eq('id', clinica_id)
    .single()
  if (!data) return { nome: 'NexusMed', endereco: '' }
  const partes = [
    data.logradouro,
    data.numero      ? `nº ${data.numero}`   : null,
    data.complemento || null,
    data.bairro      || null,
    data.cidade      || null,
    data.estado      || null,
  ].filter(Boolean)
  return {
    nome:     data.nome     || 'NexusMed',
    endereco: partes.join(', '),
  }
}

export const sendAppointmentEmail = async (req, res) => {
  try {
    const { para, paciente, medico, data, hora, consulta_id, clinica_id } = req.body

    if (!para || !paciente || !data || !hora)
      return res.status(400).json({ error: 'Campos obrigatórios: para, paciente, data, hora.' })

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para))
      return res.status(400).json({ error: 'E-mail do destinatário inválido.' })

    // Busca dados reais da clínica
    const clinica = await buscarDadosClinica(clinica_id)

    let linkConfirmacao = null
    if (consulta_id) {
      const token   = await gerarTokenConfirmacao(consulta_id)
      const baseUrl = resolverFrontendUrl(req)
      linkConfirmacao = `${baseUrl}/confirmar-consulta?token=${token}`
    }

    console.log(`[Email] Enviando para ${para} | clínica: ${clinica.nome} | link: ${linkConfirmacao}`)

    await enviarEmailConsulta({
      para, paciente,
      clinica:  clinica.nome,
      endereco: clinica.endereco,
      medico:   medico || 'A definir',
      data, hora,
      linkConfirmacao,
    })

    res.json({ success: true, message: `E-mail enviado para ${para}` })
  } catch (err) {
    console.error('[Email] Erro ao enviar:', err.message)
    res.status(500).json({ error: err.message })
  }
}
