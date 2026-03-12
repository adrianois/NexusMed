import nodemailer from 'nodemailer'

/**
 * Envia e-mail de reset de senha.
 *
 * Usa `service: 'gmail'` (HTTPS/443) para funcionar no Render,
 * que bloqueia conexões SMTP diretas (porta 587/465/25).
 *
 * Pré-requisito: EMAIL_PASS deve ser uma SENHA DE APP do Google.
 * Gere em: https://myaccount.google.com/apppasswords
 */
export async function enviarEmailResetSenha({ para, nome, token, frontendUrl }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[mailer] EMAIL_USER/EMAIL_PASS não configurados. Email não enviado.')
    console.info(`[mailer] Link de reset para ${para}: ${frontendUrl}/resetar-senha?token=${token}`)
    return
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const link = `${frontendUrl}/resetar-senha?token=${token}`

  await transporter.sendMail({
    from: `"NexusMed" <${process.env.EMAIL_USER}>`,
    to: para,
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
  })
}
