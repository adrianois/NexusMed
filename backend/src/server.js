import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import authRoutes       from './routes/authRoutes.js'
import assinaturaRoutes from './routes/assinaturaRoutes.js'
import documentoRoutes  from './routes/documentoRoutes.js'
import whatsappRoutes   from './routes/whatsappRoutes.js'

dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())

app.use('/auth',            authRoutes)
app.use('/assinatura',      assinaturaRoutes)
app.use('/medico',          documentoRoutes)
app.use('/api/whatsapp',    whatsappRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
