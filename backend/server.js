const express = require('express')
const cors = require('cors')
require('dotenv').config()

// Importa rotas
const pacienteRoutes = require('./routes/pacientes')
const consultaRoutes = require('./routes/consultas')
const prontuarioRoutes = require('./routes/prontuarios')
const clinicaRoutes = require('./routes/clinicas')
const dashboardRoutes = require('./routes/dashboard')

// Importa middleware de erros
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 4000 // alterado para evitar conflito

// Middlewares globais
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type']
}))
app.use(express.json())

// Rotas principais
app.use('/pacientes', pacienteRoutes)
app.use('/consultas', consultaRoutes)
app.use('/prontuarios', prontuarioRoutes)
app.use('/clinicas', clinicaRoutes)
app.use('/dashboard', dashboardRoutes)

// Rota raiz
app.get('/', (req, res) => {
  res.send('🚀 API NexusMed rodando com Supabase!')
})

// Middleware de tratamento de erros (sempre por último)
app.use(errorHandler)

// Inicializa servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`)
})
