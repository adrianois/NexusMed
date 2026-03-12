import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const generateTriagemPDF = (consulta, paciente, medico) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 15

  const setFont = (size = 11, bold = false) => {
    doc.setFont('Helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
  }

  const addText = (text, x = 15, size = 11, bold = false) => {
    setFont(size, bold)
    doc.text(text, x, yPos)
    yPos += size * 0.35 + 2
  }

  const addLine = () => {
    doc.setDrawColor(200, 200, 200)
    doc.line(15, yPos, pageWidth - 15, yPos)
    yPos += 5
  }

  // ─── Cabeçalho ─────────────────────────────────────
  setFont(16, true)
  doc.setTextColor(33, 128, 141) // cor teal do sistema
  doc.text('RELATÓRIO DE TRIAGEM', 15, yPos)
  yPos += 10

  addLine()

  // ─── Informações da Consulta ───────────────────────
  setFont(10, true)
  doc.setTextColor(0, 0, 0)
  doc.text('DATA E HORA DA TRIAGEM', 15, yPos)
  yPos += 5

  setFont(10)
  const dataTriage = new Date(consulta.created_at || new Date()).toLocaleDateString('pt-BR')
  const horaTriage = new Date(consulta.created_at || new Date()).toLocaleTimeString('pt-BR')
  doc.text(`Data: ${dataTriage} | Hora da Consulta: ${consulta.horario || 'N/A'} | Horário Triagem: ${horaTriage}`, 15, yPos)
  yPos += 8

  // ─── Dados do Paciente ──────────────────────────────
  setFont(10, true)
  doc.text('DADOS DO PACIENTE', 15, yPos)
  yPos += 5

  setFont(9)
  const dataPaciente = [
    ['Nome', paciente?.nome || 'N/A'],
    ['CPF', paciente?.cpf || 'N/A'],
    ['Data de Nascimento', paciente?.data_nascimento ? new Date(paciente.data_nascimento).toLocaleDateString('pt-BR') : 'N/A'],
    ['Telefone', paciente?.telefone || 'N/A'],
  ]

  doc.autoTable({
    startY: yPos,
    head: [],
    body: dataPaciente,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: 0,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', fillColor: [240, 240, 240] },
      1: { cellWidth: 100 },
    },
    margin: { left: 15, right: 15 },
  })

  yPos = doc.lastAutoTable.finalY + 8

  // ─── Dados do Médico ────────────────────────────────
  setFont(10, true)
  doc.text('MÉDICO RESPONSÁVEL', 15, yPos)
  yPos += 5

  setFont(9)
  const dataMedico = [
    ['Nome', medico?.nome || 'N/A'],
    ['CRM', medico?.crm || 'N/A'],
    ['Especialidade', medico?.especialidade || 'N/A'],
  ]

  doc.autoTable({
    startY: yPos,
    head: [],
    body: dataMedico,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: 0,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', fillColor: [240, 240, 240] },
      1: { cellWidth: 100 },
    },
    margin: { left: 15, right: 15 },
  })

  yPos = doc.lastAutoTable.finalY + 8

  // ─── Sinais Vitais ──────────────────────────────────
  setFont(10, true)
  doc.text('SINAIS VITAIS', 15, yPos)
  yPos += 5

  setFont(9)
  const sinaisVitais = [
    ['Peso', consulta.triagem_peso ? `${consulta.triagem_peso} kg` : '—'],
    ['Altura', consulta.triagem_altura ? `${consulta.triagem_altura} cm` : '—'],
    ['Pressão Arterial', consulta.triagem_pressao || '—'],
    ['Temperatura', consulta.triagem_temperatura ? `${consulta.triagem_temperatura} °C` : '—'],
    ['Frequência Cardíaca', consulta.triagem_freq_cardiaca ? `${consulta.triagem_freq_cardiaca} bpm` : '—'],
    ['Saturação de O₂', consulta.triagem_saturacao ? `${consulta.triagem_saturacao} %` : '—'],
  ]

  doc.autoTable({
    startY: yPos,
    head: ['Sinal Vital', 'Valor'],
    body: sinaisVitais,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: 0,
    },
    headStyles: {
      fillColor: [33, 128, 141],
      textColor: 255,
      fontStyle: 'bold',
    },
    margin: { left: 15, right: 15 },
  })

  yPos = doc.lastAutoTable.finalY + 8

  // ─── Classificação de Risco ────────────────────────
  const prioridadeLabel = {
    normal: 'Normal',
    prioritario: 'Prioritário',
    urgente: 'Urgente',
    emergencia: 'Emergência',
  }

  setFont(10, true)
  doc.text('CLASSIFICAÇÃO DE RISCO', 15, yPos)
  yPos += 5

  setFont(9)
  const prioridade = prioridadeLabel[consulta.triagem_prioridade || 'normal']
  doc.text(`Prioridade: ${prioridade}`, 15, yPos)
  yPos += 6

  // ─── Queixa e Observações ──────────────────────────
  if (consulta.triagem_queixa || consulta.triagem_obs) {
    setFont(10, true)
    doc.text('QUEIXA E OBSERVAÇÕES', 15, yPos)
    yPos += 5

    setFont(9)
    if (consulta.triagem_queixa) {
      doc.text('Queixa Principal:', 15, yPos)
      yPos += 4
      const queixaLines = doc.splitTextToSize(consulta.triagem_queixa, 170)
      doc.text(queixaLines, 18, yPos)
      yPos += queixaLines.length * 4 + 4
    }

    if (consulta.triagem_obs) {
      doc.text('Observações:', 15, yPos)
      yPos += 4
      const obsLines = doc.splitTextToSize(consulta.triagem_obs, 170)
      doc.text(obsLines, 18, yPos)
      yPos += obsLines.length * 4 + 4
    }

    yPos += 4
  }

  // ─── Rodapé ────────────────────────────────────────
  setFont(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Relatório gerado pelo NexusMed em ${new Date().toLocaleString('pt-BR')}`, 15, pageHeight - 10)

  // ─── Salvar PDF ─────────────────────────────────────
  const nomeArquivo = `Triagem_${paciente?.nome || 'Paciente'}_${dataTriage.replace(/\//g, '-')}.pdf`
  doc.save(nomeArquivo)
}
