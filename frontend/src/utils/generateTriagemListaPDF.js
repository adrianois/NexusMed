import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

export function generateTriagemListaPDF(consultas, pacientes, medicos, dataSel, filtroStatus) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const nomePaciente = id => pacientes.find(p => p.id === id)?.nome || '—'
  const nomeMedico   = id => {
    const m = medicos.find(m => m.id === id)
    return m ? m.nome : '—'
  }

  const dataFormatada = dataSel
    ? new Date(dataSel + 'T12:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')

  const filtroLabel = filtroStatus ? (STATUS_LABEL[filtroStatus] || filtroStatus) : 'Todos'

  // ── Cabeçalho ──────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 297, 30, 'F')

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(241, 245, 249)
  doc.text('Relatório de Triagem', 14, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(`Data: ${dataFormatada}   |   Filtro: ${filtroLabel}   |   Total: ${consultas.length} registro(s)`, 14, 22)

  const agora = new Date().toLocaleString('pt-BR')
  doc.text(`Emitido em: ${agora}`, 297 - 14, 22, { align: 'right' })

  // ── Tabela ──────────────────────────────────────────────────────
  const rows = consultas.map((c, i) => [
    i + 1,
    c.horario || '—',
    nomePaciente(c.paciente_id),
    nomeMedico(c.medico_id),
    c.motivo || '—',
    STATUS_LABEL[c.status] || c.status,
    PRIORIDADE_LABEL[c.triagem_prioridade] || 'Normal',
    c.triagem_pressao       || '—',
    c.triagem_temperatura   ? `${c.triagem_temperatura}°C` : '—',
    c.triagem_saturacao     ? `${c.triagem_saturacao}%`    : '—',
    c.triagem_freq_cardiaca ? `${c.triagem_freq_cardiaca}bpm` : '—',
    c.triagem_peso          ? `${c.triagem_peso}kg` : '—',
    c.triagem_queixa        || '—',
  ])

  autoTable(doc, {
    startY: 34,
    head: [[
      '#', 'Horário', 'Paciente', 'Médico', 'Motivo',
      'Status', 'Prioridade',
      'Pressão', 'Temp.', 'Sat.O₂', 'FC', 'Peso',
      'Queixa Principal',
    ]],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [148, 163, 184],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0:  { cellWidth: 7,  halign: 'center' },
      1:  { cellWidth: 14, halign: 'center' },
      2:  { cellWidth: 38 },
      3:  { cellWidth: 35 },
      4:  { cellWidth: 28 },
      5:  { cellWidth: 18, halign: 'center' },
      6:  { cellWidth: 18, halign: 'center' },
      7:  { cellWidth: 15, halign: 'center' },
      8:  { cellWidth: 12, halign: 'center' },
      9:  { cellWidth: 12, halign: 'center' },
      10: { cellWidth: 14, halign: 'center' },
      11: { cellWidth: 13, halign: 'center' },
      12: { cellWidth: 'auto' },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const status = consultas[data.row.index]?.status
        const cores = {
          confirmada: [96, 165, 250],
          em_triagem: [251, 191, 36],
          triado:     [74, 222, 128],
          liberada:   [148, 163, 184],
        }
        if (cores[status]) {
          doc.setTextColor(...cores[status])
          doc.setFontSize(7.5)
          doc.setFont('helvetica', 'bold')
          doc.text(
            STATUS_LABEL[status] || status,
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 0.5,
            { align: 'center', baseline: 'middle' }
          )
          doc.setTextColor(30, 41, 59)
          doc.setFont('helvetica', 'normal')
          return false
        }
      }
      if (data.section === 'body' && data.column.index === 6) {
        const prio = consultas[data.row.index]?.triagem_prioridade || 'normal'
        const cores = {
          normal:      [148, 163, 184],
          prioritario: [96, 165, 250],
          urgente:     [251, 146, 60],
          emergencia:  [248, 113, 113],
        }
        if (cores[prio]) {
          doc.setTextColor(...cores[prio])
          doc.setFontSize(7.5)
          doc.setFont('helvetica', 'bold')
          doc.text(
            PRIORIDADE_LABEL[prio],
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 0.5,
            { align: 'center', baseline: 'middle' }
          )
          doc.setTextColor(30, 41, 59)
          doc.setFont('helvetica', 'normal')
          return false
        }
      }
    },
    margin: { left: 14, right: 14 },
  })

  // ── Rodapé ──────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.height
    doc.setDrawColor(203, 213, 225)
    doc.line(14, pageH - 10, 283, pageH - 10)
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text('NexusMed — Sistema de Gestão Clínica', 14, pageH - 5)
    doc.text(`Página ${i} de ${totalPages}`, 283, pageH - 5, { align: 'right' })
  }

  const nomeArquivo = `triagem_${dataSel || 'lista'}_${filtroLabel.toLowerCase().replace(/\s/g, '_')}.pdf`
  doc.save(nomeArquivo)
}
