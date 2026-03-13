/**
 * Gera PDF da lista de consultas usando window.print() com CSS de impressão.
 * Não requer nenhuma biblioteca externa.
 */
export function gerarPdfConsultas({ clinica, consultas, nomePacienteFn, nomeMedicoFn, filtroStatus, busca }) {
  const STATUS_LABEL = {
    agendada:   'Agendada',
    confirmada: 'Confirmada',
    em_triagem: 'Em Triagem',
    triado:     'Triado',
    liberada:   'Liberada',
  }

  const formatarData = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
  const formatarCNPJ = (c) => {
    if (!c) return ''
    const s = c.replace(/\D/g, '')
    return s.length === 14
      ? s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      : c
  }

  const agora = new Date().toLocaleString('pt-BR')
  const titulo = filtroStatus && filtroStatus !== 'todos'
    ? `Consultas — ${STATUS_LABEL[filtroStatus] || filtroStatus}`
    : 'Relatório de Consultas'

  const linhas = consultas.map((c, i) => `
    <tr class="${i % 2 === 0 ? 'par' : 'impar'}">
      <td>${formatarData(c.data_consulta)}</td>
      <td>${c.horario || '—'}</td>
      <td>${nomePacienteFn(c.paciente_id)}</td>
      <td>${nomeMedicoFn(c.medico_id)}</td>
      <td>${c.motivo || '—'}</td>
      <td><span class="badge badge-${c.status}">${STATUS_LABEL[c.status] || c.status}</span></td>
    </tr>
  `).join('')

  // Bloco do logo (lado esquerdo do cabeçalho)
  const logoHtml = clinica?.logo_url
    ? `<img src="${clinica.logo_url}" alt="Logo" style="height:48px;max-width:120px;object-fit:contain;margin-right:10px;vertical-align:middle;" />`
    : ''

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${titulo} — NexusMed</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; padding: 20px 28px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e40af; padding-bottom: 12px; margin-bottom: 16px; }
    .header-esq { display: flex; align-items: center; gap: 8px; }
    .header-logo { font-size: 22px; font-weight: 900; color: #1e40af; letter-spacing: -0.5px; }
    .header-logo span { color: #3b82f6; }
    .header-clinica { text-align: right; }
    .header-clinica .nome { font-size: 13px; font-weight: 700; color: #1e293b; }
    .header-clinica .detalhe { font-size: 10px; color: #64748b; margin-top: 2px; }
    .relatorio-titulo { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .relatorio-meta { font-size: 10px; color: #64748b; margin-bottom: 14px; }
    .relatorio-meta span { margin-right: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { background: #1e40af; color: #fff; padding: 7px 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 6px 8px; font-size: 10.5px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tr.impar td { background: #f8fafc; }
    tr:last-child td { border-bottom: none; }
    .badge { padding: 2px 8px; border-radius: 20px; font-size: 9.5px; font-weight: 700; white-space: nowrap; }
    .badge-agendada   { background: #dbeafe; color: #1e40af; }
    .badge-confirmada { background: #dcfce7; color: #15803d; }
    .badge-em_triagem { background: #fef9c3; color: #92400e; }
    .badge-triado     { background: #ede9fe; color: #6d28d9; }
    .badge-liberada   { background: #f1f5f9; color: #475569; }
    .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }
    .total { margin-top: 10px; text-align: right; font-size: 10px; color: #475569; font-weight: 600; }
    @media print {
      body { padding: 10px 16px; }
      @page { margin: 15mm 12mm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-esq">
      ${logoHtml}
      <div class="header-logo">Nexus<span>Med</span></div>
    </div>
    <div class="header-clinica">
      <div class="nome">${clinica?.nome || 'Clínica'}</div>
      ${clinica?.cnpj    ? `<div class="detalhe">CNPJ: ${formatarCNPJ(clinica.cnpj)}</div>` : ''}
      ${clinica?.endereco ? `<div class="detalhe">${clinica.endereco}</div>` : ''}
      ${clinica?.cidade  ? `<div class="detalhe">${clinica.cidade}${clinica.estado ? ' — ' + clinica.estado : ''}</div>` : ''}
      ${clinica?.telefone ? `<div class="detalhe">Tel: ${clinica.telefone}</div>` : ''}
    </div>
  </div>

  <div class="relatorio-titulo">${titulo}</div>
  <div class="relatorio-meta">
    <span>📅 Gerado em: ${agora}</span>
    <span>📋 Total: ${consultas.length} consulta${consultas.length !== 1 ? 's' : ''}</span>
    ${busca ? `<span>🔍 Filtro: "${busca}"</span>` : ''}
    ${filtroStatus && filtroStatus !== 'todos' ? `<span>📌 Status: ${STATUS_LABEL[filtroStatus] || filtroStatus}</span>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Data</th><th>Horário</th><th>Paciente</th><th>Médico</th><th>Motivo</th><th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${linhas || '<tr><td colspan="6" style="text-align:center;padding:16px;color:#94a3b8">Nenhuma consulta encontrada.</td></tr>'}
    </tbody>
  </table>

  <div class="total">${consultas.length} registro${consultas.length !== 1 ? 's' : ''} exibido${consultas.length !== 1 ? 's' : ''}</div>

  <div class="footer">
    <span>NexusMed — Sistema de Gestão Médica</span>
    <span>Documento gerado em ${agora}</span>
  </div>

  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`

  const janela = window.open('', '_blank', 'width=1000,height=700')
  if (!janela) { alert('Permita pop-ups para gerar o PDF.'); return }
  janela.document.write(html)
  janela.document.close()
}
