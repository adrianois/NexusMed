const express = require('express')
const router = express.Router()
const supabase = require('../config/db')

// Rota de estatísticas do sistema
router.get('/', async (req, res) => {
  try {
    const pacientes = await supabase.from('pacientes').select('id')
    const consultas = await supabase.from('consultas').select('id')
    const prontuarios = await supabase.from('prontuarios').select('id')
    const clinicas = await supabase.from('clinicas').select('id')

    res.json({
      pacientes: pacientes.data ? pacientes.data.length : 0,
      consultas: consultas.data ? consultas.data.length : 0,
      prontuarios: prontuarios.data ? prontuarios.data.length : 0,
      clinicas: clinicas.data ? clinicas.data.length : 0
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
