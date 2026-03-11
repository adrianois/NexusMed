/**
 * /pdf — Geração de PDF de documentos médicos
 * Usa bufferPages para escrever o rodapé na última página após o conteúdo.
 */
import { Router } from 'express'
import PDFDocument from 'pdfkit'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'

const router = Router()
router.use(autenticar)

const LABELS = {
  atestado:                  'Atestado Médico',
  relatorio:                 'Relatório Médico',
  receita_simples:           'Receita Simples',
  receita_antimicrobiano:    'Receita de Antimicrobianos',
  receita_controle_especial: 'Receita de Controle Especial',
  solicitacao_exames:        'Solicitação de Exames',
  laudo:                     'Laudo Médico',
  parecer_tecnico:           'Parecer Técnico',
}

const CAMPOS_LABEL = {
  paciente:           'Paciente',
  paciente_nome:      'Paciente',
  cid:                'CID',
  cid10:              'CID-10',
  dias:               'Dias de Afastamento',
  motivo:             'Motivo',
  descricao:          'Descrição',
  medicamentos:       'Medicamentos',
  posologia:          'Posologia',
  exames:             'Exames Solicitados',
  justificativa:      'Justificativa',
  conteudo:           'Conteúdo',
  conclusao:          'Conclusão',
  recomendacoes:      'Recomendações',
  observacoes:        'Observações',
  data_inicio:        'Data de Início',
  data_fim:           'Data de Término',
  assinatura_digital: 'Assinatura Digital',
}

// GET /pdf/documento/:id
router.get('/documento/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: doc, error: e1 } = await supabase
      .from('documentos_medicos').select('*').eq('id', id).maybeSingle()
    if (e1)   return res.status(500).json({ error: e1.message })
    if (!doc) return res.status(404).json({ error: 'Documento não encontrado.' })

    const { data: medico } = await supabase
      .from('medicos').select('nome, crm, especialidade').eq('id', doc.medico_id).maybeSingle()

    let pacienteNome = doc.dados?.paciente || doc.dados?.paciente_nome || null
    if (!pacienteNome && doc.consulta_id) {
      const { data: consulta } = await supabase
        .from('consultas').select('paciente_id').eq('id', doc.consulta_id).maybeSingle()
      if (consulta?.paciente_id) {
        const { data: paciente } = await supabase
          .from('pacientes').select('nome').eq('id', consulta.paciente_id).maybeSingle()
        pacienteNome = paciente?.nome || null
      }
    }

    const titulo = LABELS[doc.tipo] || doc.tipo
    const dataDoc = new Date(doc['createdAt'] || Date.now())
    const dataFormatada = dataDoc.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    // bufferPages: true = guarda todas as páginas em memória antes de enviar
    // Isso permite navegar entre páginas depois de finalizar o conteúdo
    const pdf = new PDFDocument({ margin: 60, size: 'A4', bufferPages: true })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${doc.tipo}-${id.slice(0,8)}.pdf"`)
    pdf.pipe(res)

    // ── Cabeçalho ───────────────────────────────────────────────────────────
    pdf
      .fontSize(20).fillColor('#1351B4').text('NexusMed', { align: 'center' })
      .fontSize(10).fillColor('#64748b').text('Sistema de Gestão de Clínicas', { align: 'center' })
      .moveDown(0.5)
      .moveTo(60, pdf.y).lineTo(535, pdf.y).strokeColor('#1351B4').lineWidth(2).stroke()
      .moveDown(0.8)

    // ── Título ─────────────────────────────────────────────────────────────────
    pdf
      .fontSize(16).fillColor('#0f172a').text(titulo.toUpperCase(), { align: 'center' })
      .moveDown(1)

    // ── Data, médico, paciente ──────────────────────────────────────────────
    pdf.fontSize(10).fillColor('#475569').text(`Data: ${dataFormatada}`, { align: 'right' }).moveDown(0.5)

    if (medico) {
      pdf.fontSize(10).fillColor('#334155').text(`Dr(a). ${medico.nome}`)
      if (medico.crm)           pdf.text(`CRM: ${medico.crm}`)
      if (medico.especialidade) pdf.text(`Especialidade: ${medico.especialidade}`)
      pdf.moveDown(0.5)
    }

    if (pacienteNome) {
      pdf.fontSize(11).fillColor('#0f172a')
        .text('Paciente:', { continued: true })
        .fillColor('#334155').text(` ${pacienteNome}`)
        .moveDown(0.5)
    }

    pdf
      .moveTo(60, pdf.y).lineTo(535, pdf.y).strokeColor('#e2e8f0').lineWidth(1).stroke()
      .moveDown(0.8)

    // ── Campos do documento ───────────────────────────────────────────────
    const dados = doc.dados || {}
    const camposIgnorar = ['paciente', 'paciente_nome', 'assinatura_digital']

    Object.entries(dados).forEach(([key, value]) => {
      if (!value || camposIgnorar.includes(key)) return
      const label = CAMPOS_LABEL[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      pdf
        .fontSize(10).fillColor('#1351B4').text(`${label}:`)
        .fontSize(11).fillColor('#0f172a').text(String(value), { indent: 16 })
        .moveDown(0.4)
    })

    // ── Assinatura ───────────────────────────────────────────────────────────
    pdf.moveDown(1.5)

    if (doc.status === 'assinado') {
      pdf
        .moveTo(60, pdf.y).lineTo(535, pdf.y).strokeColor('#e2e8f0').lineWidth(1).stroke()
        .moveDown(0.6)
        .fontSize(9).fillColor('#4ade80')
        .text('✓ Documento assinado digitalmente via GOV.BR', { align: 'center' })
      if (doc.hash_documento) {
        pdf.fontSize(8).fillColor('#64748b').text(`Hash: ${doc.hash_documento}`, { align: 'center' })
      }
    } else {
      // Linha de assinatura — sem moveDown excessivo para não criar página extra
      pdf
        .moveTo(200, pdf.y).lineTo(400, pdf.y).strokeColor('#334155').lineWidth(1).stroke()
        .moveDown(0.3)
        .fontSize(9).fillColor('#64748b')
        .text(medico ? `Dr(a). ${medico.nome}` : 'Assinatura do Médico', { align: 'center' })
      if (medico?.crm) pdf.text(`CRM: ${medico.crm}`, { align: 'center' })
    }

    // ── Rodapé — usando bufferPages para escrever na última página real ──────────
    // Finalizamos o layout, depois navegamos para a última página e escrevemos
    const totalPages = pdf.bufferedPageRange().count
    // Vai para a última página gerada pelo conteúdo
    pdf.switchToPage(totalPages - 1)

    const pageHeight  = pdf.page.height
    const margemBaixo = 50
    const rodapeY     = pageHeight - margemBaixo

    // Só escreve em posição absoluta no rodapé se o cursor ainda está acima
    // Caso o conteúdo já tenha chegado lá, escreve imediatamente após
    const y = pdf.y + 12 < rodapeY ? rodapeY : pdf.y + 8

    pdf
      .fontSize(8).fillColor('#94a3b8')
      .text(
        `Documento gerado em ${dataFormatada} pelo sistema NexusMed — ID: ${id}`,
        60, y,
        { align: 'center', width: 475, lineBreak: false }
      )

    pdf.end()
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message })
  }
})

export default router
