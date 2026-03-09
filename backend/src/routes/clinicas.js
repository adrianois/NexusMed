const express = require('express')
const router = express.Router()
const clinicaController = require('../controllers/clinicaController')

// Lista todas as clínicas
router.get('/', clinicaController.listarClinicas)

// Cria uma nova clínica
router.post('/', clinicaController.criarClinica)

// Atualiza uma clínica existente
router.put('/:id', clinicaController.atualizarClinica)

// Exclui uma clínica
router.delete('/:id', clinicaController.excluirClinica)

module.exports = router
