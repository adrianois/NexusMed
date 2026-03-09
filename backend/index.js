// IMPORTANTE: dotenv deve ser o primeiro import em ES Modules
import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import authRoutes       from './routes/auth.js'
import adminRoutes      from './routes/admin.js'
import gestorRoutes     from './routes/gestor.js'
import medicosRoutes    from './routes/medicos.js'
import pacientesRoutes  from './routes/pacientes.js'
import consultasRoutes  from './routes/consultas.js'
import prontuariosRoutes from './routes/prontuarios.js'
import clinicasRoutes   from './routes/clinicas.js'

const app  = express()
const port = process.env.PORT || 4000

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}))
app.use(bodyParser.json())

app.get('/',       (_req, res) => res.send('🚀 API NexusMed rodando!'))
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/auth',        authRoutes)
app.use('/admin',       adminRoutes)
app.use('/gestor',      gestorRoutes)
app.use('/medicos',     medicosRoutes)
app.use('/pacientes',   pacientesRoutes)
app.use('/consultas',   consultasRoutes)
app.use('/prontuarios', prontuariosRoutes)
app.use('/clinicas',    clinicasRoutes)

app.listen(port, () => console.log(`🚀 Servidor rodando na porta ${port}`))
