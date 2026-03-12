import 'dotenv/config'

import express    from 'express'
import cors       from 'cors'
import bodyParser from 'body-parser'

import authRoutes              from './routes/auth.js'
import adminRoutes             from './routes/admin.js'
import gestorRoutes            from './routes/gestor.js'
import medicoRoutes            from './routes/medico.js'
import medicosRoutes           from './routes/medicos.js'
import pacientesRoutes         from './routes/pacientes.js'
import consultasRoutes         from './routes/consultas.js'
import prontuariosRoutes       from './routes/prontuarios.js'
import evolucoesRoutes         from './routes/evolucoes.js'
import clinicasRoutes          from './routes/clinicas.js'
import logsRoutes              from './routes/logs.js'
import usuariosRoutes          from './routes/usuarios.js'
import triagemRoutes           from './routes/triagem.js'
import assinaturaRoutes        from './routes/assinatura.js'
import pdfRoutes               from './routes/pdf.js'
import retornosRoutes          from './routes/retornos.js'
import posAtendimentoRoutes    from './routes/posAtendimento.js'
import agendamentoPublicoRoutes from './routes/agendamentoPublico.js'
import whatsappRoutes          from './src/routes/whatsappRoutes.js'
import emailRoutes             from './src/routes/emailRoutes.js'
import confirmacaoRoutes       from './src/routes/confirmacaoRoutes.js'

const app  = express()
const port = process.env.PORT || 4000

const ORIGENS_FIXAS = [
  'https://nexus-med-phi.vercel.app',
  'https://nexusmed.vercel.app',
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (
      origin.includes('localhost') ||
      origin.includes('app.github.dev') ||
      origin.includes('github.dev')
    ) return callback(null, true)
    if (origin.includes('nexus-med') && origin.includes('vercel.app'))
      return callback(null, true)
    if (ORIGENS_FIXAS.some(u => origin.startsWith(u)))
      return callback(null, true)
    const extras = (process.env.FRONTEND_URL || '').split(',').map(u => u.trim()).filter(Boolean)
    if (extras.some(u => origin.startsWith(u)))
      return callback(null, true)
    callback(new Error('CORS: origem não permitida: ' + origin))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(bodyParser.json())

app.get('/',       (_req, res) => res.send('🚀 API NexusMed rodando!'))
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/auth',                  authRoutes)
app.use('/admin',                 adminRoutes)
app.use('/gestor',                gestorRoutes)
app.use('/medico',                medicoRoutes)
app.use('/medicos',               medicosRoutes)
app.use('/pacientes',             pacientesRoutes)
app.use('/consultas',             consultasRoutes)
app.use('/prontuarios',           prontuariosRoutes)
app.use('/evolucoes',             evolucoesRoutes)
app.use('/clinicas',              clinicasRoutes)
app.use('/logs',                  logsRoutes)
app.use('/usuarios',              usuariosRoutes)
app.use('/triagem',               triagemRoutes)
app.use('/assinatura',            assinaturaRoutes)
app.use('/pdf',                   pdfRoutes)
app.use('/retornos',              retornosRoutes)
app.use('/pos-atendimento',       posAtendimentoRoutes)
app.use('/agendamento-publico',   agendamentoPublicoRoutes)  // ← sem autenticação
app.use('/api/whatsapp',          whatsappRoutes)
app.use('/api/email',             emailRoutes)
app.use('/api/confirmacao',       confirmacaoRoutes)

app.listen(port, () => console.log(`🚀 Servidor rodando na porta ${port}`))
