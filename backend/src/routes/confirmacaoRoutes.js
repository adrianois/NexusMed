import express from 'express'
import { gerarToken, confirmarPorToken } from '../controllers/confirmacaoController.js'

const router = express.Router()

// POST /api/confirmacao/gerar  — gera token (chamado internamente ao enviar e-mail)
router.post('/gerar', gerarToken)

// GET /api/confirmacao/:token  — paciente clica no link do e-mail
router.get('/:token', confirmarPorToken)

export default router
