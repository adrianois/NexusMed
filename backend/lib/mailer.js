import axios from 'axios'

/**
 * Envia e-mail de reset de senha via API HTTP do Resend.
 * Não usa SMTP — funciona no Render e qualquer plataforma cloud.
 *
 * Variável obrigatória: RESEND_API_KEY
 */

const RESEND_FROM = process.env.RESEND_FROM || 'NexusMed <onboarding@resend.dev>'

export async function enviarEmailResetSenha({ para, nome, token, frontendUrl }) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[mailer] RESEND_API_KEY não configurada. Email não enviado.')
    console.info(`[mailer] Link de reset para ${para}: ${frontendUrl}/resetar-senha?token=${token}`)
    return
  }

  const link = `${frontendUrl}/resetar-senha?token=${token}`

  await axios.post(
    'https://api.resend.com/emails',
    {
      from:    RESEND_FROM,
      to:      [para],
      subject: '🔒 Redefinir senha - NexusMed',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#1d4ed8">🏥 NexusMed</h2>
          <p>Olá, <strong>${nome}</strong>!</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p>Clique no botão abaixo. Este link expira em <strong>1 hora</strong>.</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${link}" style="background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem">Redefinir Senha</a>
          </div>
          <p style="color:#64748b;font-size:0.85rem">Se você não solicitou isso, ignore este e-mail.</p>
          <p style="color:#64748b;font-size:0.85rem">Link: <a href="${link}">${link}</a></p>
        </div>
      `,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  )
}
