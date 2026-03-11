/**
 * /pdf — Geração de PDF de documentos médicos
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

const MED_LABEL = {
  nome:          'Nome',
  concentracao:  'Concentração',
  forma:         'Forma farmacêutica',
  posologia:     'Posologia',
  duracao:       'Duração',
  quantidade:    'Quantidade',
}

function valorParaTexto(key, value) {
  if (Array.isArray(value)) {
    return value.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        const linhas = [`${idx + 1}.`]
        for (const [k, v] of Object.entries(item)) {
          if (!v) continue
          const label = MED_LABEL[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          linhas.push(`   ${label}: ${v}`)
        }
        return linhas.join('\n')
      }
      return `${idx + 1}. ${item}`
    }).join('\n\n')
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
      .join('\n')
  }
  return String(value)
}

function escreverRodapeLateral(pdf, dataFormatada, id) {
  const texto = `Documento gerado em ${dataFormatada} pelo sistema NexusMed — ID: ${id}`
  const pageHeight = pdf.page.height
  const x = pdf.page.width - 14
  const y = pageHeight / 2
  pdf.save()
  pdf
    .fontSize(7).fillColor('#b0b8c8')
    .rotate(90, { origin: [x, y] })
    .text(texto, x - (pageHeight * 0.35), y, {
      width: pageHeight * 0.7,
      align: 'center',
      lineBreak: false,
    })
  pdf.restore()
}

// GET /pdf/documento/:id
router.get('/documento/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: doc, error: e1 } = await supabase
      .from('documentos_medicos').select('*').eq('id', id).maybeSingle()
    if (e1)   return res.status(500).json({ error: e1.message })
    if (!doc) return res.status(404).json({ error: 'Documento não encontrado.' })

    // Busca dados do médico
    const { data: medico } = await supabase
      .from('medicos')
      .select('nome, crm, especialidade, clinica_id')
      .eq('id', doc.medico_id)
      .maybeSingle()

    // Busca dados da clínica pelo clinica_id do médico
    let clinica = null
    const clinicaId = medico?.clinica_id
    if (clinicaId) {
      const { data: cl } = await supabase
        .from('clinicas')
        .select('nome, cnpj, endereco, telefone')
        .eq('id', clinicaId)
        .maybeSingle()
      clinica = cl || null
    }

    // Busca nome do paciente
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

    const titulo        = LABELS[doc.tipo] || doc.tipo
    const dataDoc       = new Date(doc['createdAt'] || Date.now())
    const dataFormatada = dataDoc.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const pdf = new PDFDocument({ margin: 60, size: 'A4', bufferPages: true })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${doc.tipo}-${id.slice(0,8)}.pdf"`)
    pdf.pipe(res)

    // ── Cabeçalho da Clínica ────────────────────────────────────────────────
    if (clinica) {
      pdf
        .fontSize(18).fillColor('#1351B4').text(clinica.nome, { align: 'center' })
      const infos = []
      if (clinica.cnpj)     infos.push(`CNPJ: ${clinica.cnpj}`)
      if (clinica.endereco) infos.push(clinica.endereco)
      if (clinica.telefone) infos.push(`Tel: ${clinica.telefone}`)
      if (infos.length > 0) {
        pdf.fontSize(9).fillColor('#64748b').text(infos.join('  |  '), { align: 'center' })
      }
    } else {
      // Fallback genérico caso não haja clínica vinculada
      pdf
        .fontSize(18).fillColor('#1351B4').text('NexusMed', { align: 'center' })
        .fontSize(9).fillColor('#64748b').text('Sistema de Gestão de Clínicas', { align: 'center' })
    }

    pdf
      .moveDown(0.5)
      .moveTo(60, pdf.y).lineTo(535, pdf.y).strokeColor('#1351B4').lineWidth(2).stroke()
      .moveDown(0.8)

    // ── Título do documento ──────────────────────────────────────────────────
    pdf
      .fontSize(15).fillColor('#0f172a').text(titulo.toUpperCase(), { align: 'center' })
      .moveDown(1)

    // ── Data + Médico + Paciente ─────────────────────────────────────────────
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

    // ── Campos do documento ──────────────────────────────────────────────────
    const dados = doc.dados || {}
    const camposIgnorar = ['paciente', 'paciente_nome', 'assinatura_digital']

    Object.entries(dados).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || camposIgnorar.includes(key)) return
      if (Array.isArray(value) && value.length === 0) return

      const label = CAMPOS_LABEL[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const texto = valorParaTexto(key, value)

      pdf
        .fontSize(10).fillColor('#1351B4').text(`${label}:`)
        .fontSize(11).fillColor('#0f172a').text(texto, { indent: 16 })
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
      pdf
        .moveTo(200, pdf.y).lineTo(400, pdf.y).strokeColor('#334155').lineWidth(1).stroke()
        .moveDown(0.3)
        .fontSize(9).fillColor('#64748b')
        .text(medico ? `Dr(a). ${medico.nome}` : 'Assinatura do Médico', { align: 'center' })
      if (medico?.crm) pdf.text(`CRM: ${medico.crm}`, { align: 'center' })
    }

    // ── Rodapé lateral ───────────────────────────────────────────────────────
    pdf.switchToPage(0)
    escreverRodapeLateral(pdf, dataFormatada, id)

    pdf.end()
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message })
  }
})

export default router
