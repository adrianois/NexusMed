const express = require('express')
const router = express.Router()
const consultaController = require('../controllers/consultaController')

// Lista todas as consultas
router.get('/', consultaController.listarConsultas)

// Cria uma nova consulta
router.post('/', consultaController.criarConsulta)

// Atualiza uma consulta existente
router.put('/:id', consultaController.atualizarConsulta)

// Exclui uma consulta
router.delete('/:id', consultaController.excluirConsulta)

module.exports = router
