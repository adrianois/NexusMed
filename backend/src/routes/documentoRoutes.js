/**
 * documentoRoutes.js
 * Prefixo montado em server.js: /medico
 *
 * Rotas disponíveis:
 *   POST /medico/documento                        — Cria e gera PDF
 *   GET  /medico/documento/consulta/:consultaId   — Lista por consulta
 *   GET  /medico/documento/:id                    — Detalhes de um documento
 *   GET  /medico/documento/:id/pdf                — Download do PDF
 */
import express from 'express';
import { verificarToken } from '../middleware/authMiddleware.js';
import {
  criarDocumento,
  buscarDocumento,
  listarDocumentosConsulta,
  downloadPdf,
} from '../controllers/documentoController.js';

const router = express.Router();

// Todas as rotas exigem JWT válido
router.use(verificarToken);

router.post('/documento',                         criarDocumento);
router.get('/documento/consulta/:consultaId',     listarDocumentosConsulta);
router.get('/documento/:id/pdf',                  downloadPdf);
router.get('/documento/:id',                      buscarDocumento);

export default router;
