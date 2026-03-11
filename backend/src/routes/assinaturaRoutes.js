import express from 'express';
import {
  iniciarAssinatura,
  callbackAssinatura,
  statusAssinatura,
} from '../controllers/assinaturaController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Inicia o fluxo de assinatura (requer autenticação JWT)
router.post('/iniciar', verificarToken, iniciarAssinatura);

// Callback OAuth do GOV.BR (não requer JWT pois vem de redirect externo)
router.get('/callback', callbackAssinatura);

// Status de assinatura de um documento (requer autenticação JWT)
router.get('/status/:tipo/:id', verificarToken, statusAssinatura);

export default router;
