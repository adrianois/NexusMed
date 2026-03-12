import jsPDF from 'jspdf'
import 'jspdf-autotable'

const PRIORIDADE_CORES = {
  normal:      { r: 148, g: 163, b: 184, label: 'Normal' },
  prioritario: { r: 96,  g: 165, b: 250, label: 'Prioritário' },
  urgente:     { r: 251, g: 146, b: 60,  label: 'Urgente' },
  emergencia:  { r: 248, g: 113, b: 113, label: 'Emergência' },
}

const calcularIMC = (peso, altura) => {
  if (!peso || !altura) return null
  const p = parseFloat(peso)
  const a = parseFloat(altura) / 100
  if (isNaN(p) || isNaN(a) || a === 0) return null
  const imc = (p / (a * a)).toFixed(1)
  let classificacao = ''
  if      (imc < 18.5) classificacao = 'Abaixo do peso'
  else if (imc < 25)   classificacao = 'Peso normal'
  else if (imc < 30)   classificacao = 'Sobrepeso'
  else if (imc < 35)   classificacao = 'Obesidade Grau I'
  else if (imc < 40)   classificacao = 'Obesidade Grau II'
  else                 classificacao = 'Obesidade Grau III'
  return { valor: imc, classificacao }
}

export const generateTriagemPDF = (consulta, paciente, medico) => {
  const doc = new jsPDF()
  const pageWidth  = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = 15

  const TEAL   = [33, 128, 141]
  const DARK   = [15, 23, 42]
  const GRAY   = [100, 116, 139]
  const LIGHT  = [248, 250, 252]
  const WHITE  = [255, 255, 255]
  const BLACK  = [0, 0, 0]
  const BORDER = [226, 232, 240]

  const prioCfg = PRIORIDADE_CORES[consulta.triagem_prioridade || 'normal']

  // ─── Faixa de cabeçalho ─────────────────────────────────────────────
  doc.setFillColor(...TEAL)
  doc.rect(0, 0, pageWidth, 32, 'F')

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...WHITE)
  doc.text('NexusMed', 15, 13)

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 235, 240)
  doc.text('Sistema de Gestão em Saúde', 15, 20)

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...WHITE)
  doc.text('RELATÓRIO DE TRIAGEM', pageWidth - 15, 13, { align: 'right' })

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(200, 235, 240)
  doc.text(`Nº ${consulta.id || '—'} · ${new Date().toLocaleString('pt-BR')}`, pageWidth - 15, 20, { align: 'right' })

  y = 40

  // ─── Badge de prioridade ────────────────────────────────────────────
  doc.setFillColor(prioCfg.r, prioCfg.g, prioCfg.b)
  doc.roundedRect(15, y, 60, 11, 3, 3, 'F')
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...WHITE)
  doc.text(`PRIORIDADE: ${prioCfg.label.toUpperCase()}`, 45, y + 7.5, { align: 'center' })

  const dataConsulta = consulta.data
    ? new Date(consulta.data + 'T12:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text(`Data da Consulta: ${dataConsulta}   |   Horário: ${consulta.horario || 'N/A'}`, pageWidth - 15, y + 7.5, { align: 'right' })

  y += 18

  // ─── Seção: Dados do Paciente ───────────────────────────────────────
  const sectionHeader = (label, yStart) => {
    doc.setFillColor(...TEAL)
    doc.rect(15, yStart, pageWidth - 30, 8, 'F')
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...WHITE)
    doc.text(label, 18, yStart + 5.5)
    return yStart + 10
  }

  y = sectionHeader('DADOS DO PACIENTE', y)

  doc.autoTable({
    startY: y,
    head: [],
    body: [
      ['Nome',               paciente?.nome               || 'N/A'],
      ['CPF',                paciente?.cpf                || 'N/A'],
      ['Data de Nascimento', paciente?.data_nascimento
        ? new Date(paciente.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR')
        : 'N/A'],
      ['Telefone',           paciente?.telefone           || 'N/A'],
      ['Email',              paciente?.email              || 'N/A'],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, textColor: BLACK },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
  })
  y = doc.lastAutoTable.finalY + 6

  // ─── Seção: Médico Responsável ──────────────────────────────────────
  y = sectionHeader('MÉDICO RESPONSÁVEL', y)

  doc.autoTable({
    startY: y,
    head: [],
    body: [
      ['Nome',         medico?.nome          || 'N/A'],
      ['CRM',          medico?.crm           || 'N/A'],
      ['Especialidade',medico?.especialidade || 'N/A'],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, textColor: BLACK },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
  })
  y = doc.lastAutoTable.finalY + 6

  // ─── Seção: Sinais Vitais ───────────────────────────────────────────
  y = sectionHeader('SINAIS VITAIS', y)

  const imc = calcularIMC(consulta.triagem_peso, consulta.triagem_altura)
  const sinaisVitais = [
    ['Peso',                consulta.triagem_peso           ? `${consulta.triagem_peso} kg`         : '—'],
    ['Altura',              consulta.triagem_altura         ? `${consulta.triagem_altura} cm`        : '—'],
    ['IMC',                 imc                             ? `${imc.valor} kg/m²  (${imc.classificacao})` : '—'],
    ['Pressão Arterial',    consulta.triagem_pressao                                                 || '—'],
    ['Temperatura',         consulta.triagem_temperatura    ? `${consulta.triagem_temperatura} °C`  : '—'],
    ['Frequência Cardíaca', consulta.triagem_freq_cardiaca  ? `${consulta.triagem_freq_cardiaca} bpm`: '—'],
    ['Saturação de O₂',    consulta.triagem_saturacao      ? `${consulta.triagem_saturacao} %`     : '—'],
  ]

  doc.autoTable({
    startY: y,
    head: [['Sinal Vital', 'Valor']],
    body: sinaisVitais,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, textColor: BLACK },
    headStyles: { fillColor: TEAL, textColor: WHITE, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
    // destaca IMC se fora da faixa normal
    didParseCell: (data) => {
      if (data.row.index === 2 && data.column.index === 1 && imc) {
        const v = parseFloat(imc.valor)
        if (v < 18.5 || v >= 25) {
          data.cell.styles.textColor = [220, 38, 38]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })
  y = doc.lastAutoTable.finalY + 6

  // ─── Seção: Queixa e Observações ───────────────────────────────────
  if (consulta.triagem_queixa || consulta.triagem_obs) {
    y = sectionHeader('QUEIXA E OBSERVAÇÕES', y)

    const rows = []
    if (consulta.triagem_queixa) rows.push(['Queixa Principal', consulta.triagem_queixa])
    if (consulta.triagem_obs)    rows.push(['Observações',      consulta.triagem_obs])

    doc.autoTable({
      startY: y,
      head: [],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5, textColor: BLACK },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold', fillColor: LIGHT },
        1: { cellWidth: 'auto' },
      },
      margin: { left: 15, right: 15 },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ─── Assinatura ─────────────────────────────────────────────────────
  const spaceNeeded = 50
  if (y + spaceNeeded > pageHeight - 20) {
    doc.addPage()
    y = 20
  }

  y += 10
  doc.setDrawColor(...BORDER)
  doc.line(15, y + 20, 90, y + 20)
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text('Assinatura do Profissional', 52, y + 26, { align: 'center' })
  doc.text(medico?.nome ? `Dr(a). ${medico.nome}` : '', 52, y + 31, { align: 'center' })
  doc.text(medico?.crm  ? `CRM: ${medico.crm}`    : '', 52, y + 36, { align: 'center' })

  doc.line(pageWidth - 90, y + 20, pageWidth - 15, y + 20)
  doc.text('Data e Carimbo', pageWidth - 52, y + 26, { align: 'center' })

  // ─── Rodapé ─────────────────────────────────────────────────────────
  doc.setFillColor(...TEAL)
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...WHITE)
  doc.text(
    `Relatório gerado pelo NexusMed em ${new Date().toLocaleString('pt-BR')} · Documento de uso interno`,
    pageWidth / 2, pageHeight - 4.5, { align: 'center' }
  )

  // ─── Salvar PDF ──────────────────────────────────────────────────────
  const dataFmt = dataConsulta.replace(/\//g, '-')
  const nomeArq = `Triagem_${paciente?.nome?.replace(/\s+/g, '_') || 'Paciente'}_${dataFmt}.pdf`
  doc.save(nomeArq)
}
