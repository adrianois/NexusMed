import nodemailer from 'nodemailer'

export async function enviarEmailResetSenha({ para, nome, token, frontendUrl }) {
  // Se SMTP não estiver configurado, apenas loga e retorna
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP_USER/SMTP_PASS não configurados. Email não enviado.')
    console.info(`[mailer] Link de reset para ${para}: ${frontendUrl}/resetar-senha?token=${token}`)
    return
  }

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const link = `${frontendUrl}/resetar-senha?token=${token}`

  await transporter.sendMail({
    from: `"NexusMed" <${process.env.SMTP_USER}>`,
    to: para,
    subject: '\uD83D\uDD12 Redefinir senha - NexusMed',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#1d4ed8">\uD83C\uDFE5 NexusMed</h2>
        <p>Ol\u00e1, <strong>${nome}</strong>!</p>
        <p>Recebemos uma solicita\u00e7\u00e3o para redefinir a senha da sua conta.</p>
        <p>Clique no bot\u00e3o abaixo. Este link expira em <strong>1 hora</strong>.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${link}" style="background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem">Redefinir Senha</a>
        </div>
        <p style="color:#64748b;font-size:0.85rem">Se voc\u00ea n\u00e3o solicitou isso, ignore este e-mail.</p>
        <p style="color:#64748b;font-size:0.85rem">Link: <a href="${link}">${link}</a></p>
      </div>
    `,
  })
}
