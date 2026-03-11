/**
 * documentoController.js
 * Reescrito para usar Supabase (padrão do projeto) em vez de Sequelize.
 * Causa do bug anterior: database.js não existia no repositório.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import {
  createDocumento,
  updateDocumento,
  findDocumentoById,
  findDocumentosByConsulta,
  TIPOS_VALIDOS,
} from '../models/documentoModel.js'
import { gerarPdfDocumento } from '../services/pdfService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─────────────────────────────────────────────────────────────
// POST /medico/documento
// Body: { tipo, consulta_id, dados }
// ─────────────────────────────────────────────────────────────
export async function criarDocumento(req, res) {
  try {
    const { tipo, consulta_id, dados } = req.body
    const medicoId = req.usuario?.id

    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ erro: `Tipo inválido. Permitidos: ${TIPOS_VALIDOS.join(', ')}` })
    }
    if (!consulta_id) {
      return res.status(400).json({ erro: 'consulta_id é obrigatório.' })
    }
    if (!dados || typeof dados !== 'object') {
      return res.status(400).json({ erro: 'Dados do documento são obrigatórios.' })
    }

    // Cria registro no Supabase
    const doc = await createDocumento({
      tipo,
      consulta_id,
      medico_id: medicoId,
      dados,
    })

    // Tenta gerar PDF (não bloqueia em caso de falha)
    try {
      const { caminho, hash } = await gerarPdfDocumento(doc)
      await updateDocumento(doc.id, { arquivo_pdf: caminho, hash_documento: hash })
      doc.arquivo_pdf = caminho
    } catch (pdfErr) {
      console.error('[documentoController] Erro ao gerar PDF:', pdfErr.message)
    }

    return res.status(201).json({
      id:          doc.id,
      tipo:        doc.tipo,
      status:      doc.status,
      arquivo_pdf: doc.arquivo_pdf || null,
    })
  } catch (err) {
    console.error('[documentoController] criarDocumento:', err)
    return res.status(500).json({ erro: 'Erro interno ao criar documento.' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /medico/documento/:id
// ─────────────────────────────────────────────────────────────
export async function buscarDocumento(req, res) {
  try {
    const doc = await findDocumentoById(req.params.id)
    if (!doc) return res.status(404).json({ erro: 'Documento não encontrado.' })

    if (doc.medico_id !== req.usuario?.id) {
      return res.status(403).json({ erro: 'Acesso negado.' })
    }

    return res.json(doc)
  } catch (err) {
    console.error('[documentoController] buscarDocumento:', err)
    return res.status(500).json({ erro: 'Erro interno.' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /medico/documento/consulta/:consultaId
// ─────────────────────────────────────────────────────────────
export async function listarDocumentosConsulta(req, res) {
  try {
    const docs = await findDocumentosByConsulta(req.params.consultaId)
    return res.json(docs)
  } catch (err) {
    console.error('[documentoController] listarDocumentosConsulta:', err)
    return res.status(500).json({ erro: 'Erro interno.' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /medico/documento/:id/pdf
// ─────────────────────────────────────────────────────────────
export async function downloadPdf(req, res) {
  try {
    const doc = await findDocumentoById(req.params.id)
    if (!doc) return res.status(404).json({ erro: 'Documento não encontrado.' })
    if (!doc.arquivo_pdf) return res.status(404).json({ erro: 'PDF ainda não gerado.' })

    if (doc.medico_id !== req.usuario?.id) {
      return res.status(403).json({ erro: 'Acesso negado.' })
    }

    const caminhoAbsoluto = path.resolve(__dirname, '../../..', doc.arquivo_pdf)
    return res.download(caminhoAbsoluto)
  } catch (err) {
    console.error('[documentoController] downloadPdf:', err)
    return res.status(500).json({ erro: 'Erro ao baixar PDF.' })
  }
}
