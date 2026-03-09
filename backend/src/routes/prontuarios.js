const express = require('express')
const router = express.Router()
const prontuarioController = require('../controllers/prontuarioController')

// Lista todos os prontuários
router.get('/', prontuarioController.listarProntuarios)

// Cria um novo prontuário
router.post('/', prontuarioController.criarProntuario)

// Atualiza um prontuário existente
router.put('/:id', prontuarioController.atualizarProntuario)

// Exclui um prontuário
router.delete('/:id', prontuarioController.excluirProntuario)

module.exports = router
