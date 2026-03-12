import nodemailer from 'nodemailer'

const criarTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT)   || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

/**
 * Envia e-mail de confirmação de consulta ao paciente
 */
export const enviarEmailConsulta = async ({ para, paciente, clinica, medico, data, hora }) => {
  const transporter = criarTransporter()

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

            <!-- Cabeçalho -->
            <tr>
              <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">&#x1F3E5; ${clinica}</h1>
                <p style="margin:8px 0 0;color:#e0f2fe;font-size:14px;">Confirmação de Consulta</p>
              </td>
            </tr>

            <!-- Corpo -->
            <tr>
              <td style="padding:36px 40px;">
                <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Olá, <strong>${paciente}</strong>!</p>
                <p style="margin:0 0 28px;color:#475569;font-size:15px;">Sua consulta foi agendada com sucesso. Confira os detalhes abaixo:</p>

                <!-- Card de detalhes -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                            <span style="color:#64748b;font-size:13px;">&#x1F3E5; Clínica</span><br>
                            <strong style="color:#1e293b;font-size:15px;">${clinica}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                            <span style="color:#64748b;font-size:13px;">&#x1F468;&#x200D;&#x2695;&#xFE0F; Médico</span><br>
                            <strong style="color:#1e293b;font-size:15px;">${medico}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                            <span style="color:#64748b;font-size:13px;">&#x1F4C5; Data</span><br>
                            <strong style="color:#1e293b;font-size:15px;">${data}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;">
                            <span style="color:#64748b;font-size:13px;">&#x1F550; Horário</span><br>
                            <strong style="color:#1e293b;font-size:15px;">${hora}</strong>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 8px;color:#475569;font-size:14px;">Caso precise cancelar ou reagendar, entre em contato com nossa equipe com antecedência.</p>
              </td>
            </tr>

            <!-- Rodapé -->
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">${clinica} &mdash; Este é um e-mail automático, não responda.</p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `"${clinica}" <${process.env.EMAIL_USER}>`,
    to:   para,
    subject: `✅ Consulta confirmada — ${data} às ${hora}`,
    html,
  })
}
