/**
 * Gera PDF da lista de triagem usando window.print() com CSS de impressão.
 * Segue o MESMO PADRÃO da página de Consultas (pdfConsultas.js).
 * Não requer nenhuma biblioteca externa (não usa jsPDF/autoTable).
 */
export function generateTriagemListaPDF(consultas, pacientes, medicos, dataSel, filtroStatus, clinica) {
  const STATUS_LABEL = {
    confirmada: 'Aguardando',
    em_triagem: 'Em Triagem',
    triado:     'Triado',
    liberada:   'Liberado',
  }

  const PRIORIDADE_LABEL = {
    normal:      'Normal',
    prioritario: 'Prioritário',
    urgente:     'Urgente',
    emergencia:  'Emergência',
  }

  const nomePaciente = id => pacientes.find(p => p.id === id)?.nome || '—'
  const nomeMedico   = id => medicos.find(m => m.id === id)?.nome || '—'
  const formatarData = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
  const formatarCNPJ = (c) => {
    if (!c) return ''
    const s = c.replace(/\D/g, '')
    return s.length === 14
      ? s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      : c
  }

  const agora = new Date().toLocaleString('pt-BR')
  const dataFormatada = dataSel
    ? new Date(dataSel + 'T12:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')
  const filtroLabel = filtroStatus ? (STATUS_LABEL[filtroStatus] || filtroStatus) : 'Todos'

  const titulo = filtroStatus && filtroStatus !== 'todos'
    ? `Triagem — ${STATUS_LABEL[filtroStatus] || filtroStatus}`
    : 'Relatório de Triagem'

  const linhas = consultas.map((c, i) => `
    <tr class="${i % 2 === 0 ? 'par' : 'impar'}">
      <td>${formatarData(c.data_consulta || dataSel)}</td>
      <td>${c.horario || '—'}</td>
      <td>${nomePaciente(c.paciente_id)}</td>
      <td>${nomeMedico(c.medico_id)}</td>
      <td>${c.motivo || '—'}</td>
      <td><span class="badge badge-${c.status}">${STATUS_LABEL[c.status] || c.status}</span></td>
      <td><span class="badge badge-prio-${c.triagem_prioridade || 'normal'}">${PRIORIDADE_LABEL[c.triagem_prioridade || 'normal']}</span></td>
      <td>${c.triagem_pressao || '—'}</td>
      <td>${c.triagem_temperatura ? c.triagem_temperatura + '°C' : '—'}</td>
      <td>${c.triagem_saturacao ? c.triagem_saturacao + '%' : '—'}</td>
      <td>${c.triagem_freq_cardiaca ? c.triagem_freq_cardiaca + 'bpm' : '—'}</td>
      <td>${c.triagem_peso ? c.triagem_peso + 'kg' : '—'}</td>
      <td>${c.triagem_queixa || '—'}</td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${titulo} — NexusMed</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #1a1a1a; background: #fff; padding: 20px 28px; }

    /* Cabeçalho */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e40af; padding-bottom: 12px; margin-bottom: 16px; }
    .header-logo { font-size: 22px; font-weight: 900; color: #1e40af; letter-spacing: -0.5px; }
    .header-logo span { color: #3b82f6; }
    .header-clinica { text-align: right; }
    .header-clinica .nome { font-size: 13px; font-weight: 700; color: #1e293b; }
    .header-clinica .detalhe { font-size: 10px; color: #64748b; margin-top: 2px; }

    /* Subtítulo do relatório */
    .relatorio-titulo { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .relatorio-meta { font-size: 10px; color: #64748b; margin-bottom: 14px; }
    .relatorio-meta span { margin-right: 16px; }

    /* Tabela */
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { background: #1e40af; color: #fff; padding: 7px 6px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 5px 6px; font-size: 9px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tr.impar td { background: #f8fafc; }
    tr:last-child td { border-bottom: none; }

    /* Badges de status */
    .badge { padding: 2px 6px; border-radius: 20px; font-size: 8px; font-weight: 700; white-space: nowrap; display: inline-block; }
    .badge-confirmada   { background: #dbeafe; color: #1e40af; }
    .badge-em_triagem   { background: #fef9c3; color: #92400e; }
    .badge-triado       { background: #dcfce7; color: #15803d; }
    .badge-liberada     { background: #f1f5f9; color: #475569; }

    .badge-prio-normal      { background: #f1f5f9; color: #475569; }
    .badge-prio-prioritario { background: #dbeafe; color: #1e40af; }
    .badge-prio-urgente     { background: #fed7aa; color: #c2410c; }
    .badge-prio-emergencia  { background: #fecaca; color: #991b1b; }

    /* Rodapé */
    .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }

    /* Total */
    .total { margin-top: 10px; text-align: right; font-size: 9px; color: #475569; font-weight: 600; }

    @media print {
      body { padding: 10px 16px; }
      @page { margin: 10mm 8mm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logo">Nexus<span>Med</span></div>
    <div class="header-clinica">
      <div class="nome">${clinica?.nome || 'Clínica'}</div>
      ${clinica?.cnpj ? `<div class="detalhe">CNPJ: ${formatarCNPJ(clinica.cnpj)}</div>` : ''}
      ${clinica?.endereco ? `<div class="detalhe">${clinica.endereco}</div>` : ''}
      ${clinica?.cidade ? `<div class="detalhe">${clinica.cidade}${clinica.estado ? ' — ' + clinica.estado : ''}</div>` : ''}
      ${clinica?.telefone ? `<div class="detalhe">Tel: ${clinica.telefone}</div>` : ''}
    </div>
  </div>

  <div class="relatorio-titulo">${titulo}</div>
  <div class="relatorio-meta">
    <span>📅 Data: ${dataFormatada}</span>
    <span>📌 Status: ${filtroLabel}</span>
    <span>📋 Total: ${consultas.length} registro${consultas.length !== 1 ? 's' : ''}</span>
    <span>⏰ Emitido: ${agora}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Horário</th>
        <th>Paciente</th>
        <th>Médico</th>
        <th>Motivo</th>
        <th>Status</th>
        <th>Prioridade</th>
        <th>Pressão</th>
        <th>Temp.</th>
        <th>Sat. O₂</th>
        <th>FC</th>
        <th>Peso</th>
        <th>Queixa</th>
      </tr>
    </thead>
    <tbody>
      ${linhas || '<tr><td colspan="13" style="text-align:center;padding:16px;color:#94a3b8">Nenhuma triagem encontrada.</td></tr>'}
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

  const janela = window.open('', '_blank', 'width=1200,height=700')
  if (!janela) {
    alert('Permita pop-ups para gerar o PDF.')
    return
  }
  janela.document.write(html)
  janela.document.close()
}
