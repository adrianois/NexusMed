/**
 * documentoController.js
 * Controlador dos documentos médicos.
 *
 * Endpoints:
 *   POST /medico/documento          — Cria documento e gera PDF
 *   GET  /medico/documento/:id      — Retorna metadados do documento
 *   GET  /medico/documento/consulta/:consultaId — Lista documentos da consulta
 *   GET  /medico/documento/:id/pdf  — Faz download do PDF
 */
import path from 'path';
import { fileURLToPath } from 'url';
import Documento, { TIPOS_VALIDOS } from '../models/Documento.js';
import { gerarPdfDocumento } from '../services/pdfService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// POST /medico/documento
// Body: { tipo, consulta_id, dados }
// ─────────────────────────────────────────────────────────────
export async function criarDocumento(req, res) {
  try {
    const { tipo, consulta_id, dados } = req.body;
    const medicoId = req.usuario?.id;   // injetado pelo verificarToken

    // Validações básicas
    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ erro: `Tipo inválido. Permitidos: ${TIPOS_VALIDOS.join(', ')}` });
    }
    if (!consulta_id) {
      return res.status(400).json({ erro: 'consulta_id é obrigatório.' });
    }
    if (!dados || typeof dados !== 'object') {
      return res.status(400).json({ erro: 'Dados do documento são obrigatórios.' });
    }

    // Cria o registro no banco
    const doc = await Documento.create({
      tipo,
      consultaId: consulta_id,
      medicoId,
      dados,
      status: 'pendente_assinatura',
    });

    // Tenta gerar o PDF (não bloqueia criação se falhar)
    try {
      const { caminho, hash } = await gerarPdfDocumento(doc);
      await doc.update({ arquivoPdf: caminho, hashDocumento: hash });
    } catch (pdfErr) {
      console.error('[documentoController] Erro ao gerar PDF:', pdfErr.message);
      // Documento criado, PDF pendente — não é erro fatal
    }

    return res.status(201).json({
      id:     doc.id,
      tipo:   doc.tipo,
      status: doc.status,
      arquivoPdf: doc.arquivoPdf || null,
    });
  } catch (err) {
    console.error('[documentoController] criarDocumento:', err);
    return res.status(500).json({ erro: 'Erro interno ao criar documento.' });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /medico/documento/:id
// ─────────────────────────────────────────────────────────────
export async function buscarDocumento(req, res) {
  try {
    const doc = await Documento.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ erro: 'Documento não encontrado.' });

    // Garante que somente o médico dono ou admin acessa
    if (doc.medicoId !== req.usuario?.id && req.usuario?.role !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado.' });
    }

    return res.json(doc);
  } catch (err) {
    console.error('[documentoController] buscarDocumento:', err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /medico/documento/consulta/:consultaId
// ─────────────────────────────────────────────────────────────
export async function listarDocumentosConsulta(req, res) {
  try {
    const docs = await Documento.findAll({
      where: { consultaId: req.params.consultaId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'tipo', 'status', 'arquivoPdf', 'createdAt'],
    });
    return res.json(docs);
  } catch (err) {
    console.error('[documentoController] listarDocumentosConsulta:', err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /medico/documento/:id/pdf  — download direto do arquivo
// ─────────────────────────────────────────────────────────────
export async function downloadPdf(req, res) {
  try {
    const doc = await Documento.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ erro: 'Documento não encontrado.' });
    if (!doc.arquivoPdf) return res.status(404).json({ erro: 'PDF ainda não gerado.' });

    const caminhoAbsoluto = path.resolve(__dirname, '../../..', doc.arquivoPdf);
    return res.download(caminhoAbsoluto);
  } catch (err) {
    console.error('[documentoController] downloadPdf:', err);
    return res.status(500).json({ erro: 'Erro ao baixar PDF.' });
  }
}
