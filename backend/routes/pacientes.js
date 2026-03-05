const express = require('express')
const router = express.Router()
const pacienteController = require('../controllers/pacienteController')

// Lista todos os pacientes
router.get('/', pacienteController.listarPacientes)

// Cria um novo paciente
router.post('/', pacienteController.criarPaciente)

// Atualiza um paciente existente
router.put('/:id', pacienteController.atualizarPaciente)

// Exclui um paciente
router.delete('/:id', pacienteController.excluirPaciente)

module.exports = router
