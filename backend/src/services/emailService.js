import nodemailer from 'nodemailer'

const criarTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

export const enviarEmailConsulta = async ({ para, paciente, clinica, medico, data, hora, linkConfirmacao }) => {
  const transporter = criarTransporter()

  const botaoConfirmacao = linkConfirmacao ? `
    <tr>
      <td style="padding:0 40px 32px;text-align:center;">
        <a href="${linkConfirmacao}"
           style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;
                  text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;
                  font-weight:700;letter-spacing:0.5px;">
          ✅ Confirmar minha Consulta
        </a>
        <p style="margin:12px 0 0;color:#94a3b8;font-size:12px;">Link válido por 48 horas</p>
      </td>
    </tr>` : ''

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0"
            style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

            <!-- Cabeçalho -->
            <tr>
              <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:24px;">🏥 ${clinica}</h1>
                <p style="margin:8px 0 0;color:#e0f2fe;font-size:14px;">Confirmação de Consulta</p>
              </td>
            </tr>

            <!-- Corpo -->
            <tr>
              <td style="padding:36px 40px 24px;">
                <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Olá, <strong>${paciente}</strong>!</p>
                <p style="margin:0 0 28px;color:#475569;font-size:15px;">Sua consulta foi agendada. Confira os detalhes e confirme sua presença clicando no botão abaixo:</p>
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                  <tr><td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                        <span style="color:#64748b;font-size:13px;">🏥 Clínica</span><br>
                        <strong style="color:#1e293b;font-size:15px;">${clinica}</strong>
                      </td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                        <span style="color:#64748b;font-size:13px;">👨‍⚕️ Médico</span><br>
                        <strong style="color:#1e293b;font-size:15px;">${medico}</strong>
                      </td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                        <span style="color:#64748b;font-size:13px;">📅 Data</span><br>
                        <strong style="color:#1e293b;font-size:15px;">${data}</strong>
                      </td></tr>
                      <tr><td style="padding:8px 0;">
                        <span style="color:#64748b;font-size:13px;">🕐 Horário</span><br>
                        <strong style="color:#1e293b;font-size:15px;">${hora}</strong>
                      </td></tr>
                    </table>
                  </td></tr>
                </table>
              </td>
            </tr>

            <!-- Botão de confirmação -->
            ${botaoConfirmacao}

            <!-- Rodapé -->
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
                <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">
                  Caso não consiga clicar no botão, copie e cole este link no navegador:
                </p>
                <p style="margin:0;word-break:break-all;">
                  <a href="${linkConfirmacao}" style="color:#6366f1;font-size:11px;">${linkConfirmacao}</a>
                </p>
                <p style="margin:16px 0 0;color:#cbd5e1;font-size:11px;">${clinica} — E-mail automático, não responda.</p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>`

  await transporter.sendMail({
    from:    `"${clinica}" <${process.env.EMAIL_USER}>`,
    to:      para,
    subject: `✅ Confirme sua consulta — ${data} às ${hora} | ${clinica}`,
    html,
  })
}
