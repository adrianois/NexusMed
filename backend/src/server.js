import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import sequelize from "./config/database.js"
import authRoutes       from "./routes/authRoutes.js"
import assinaturaRoutes from "./routes/assinaturaRoutes.js"
import documentoRoutes  from "./routes/documentoRoutes.js"

dotenv.config()
const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Rotas de autenticação
app.use("/auth", authRoutes)

// Rotas de assinatura GOV.BR
app.use("/assinatura", assinaturaRoutes)

// Rotas do módulo médico (documentos)
app.use("/medico", documentoRoutes)

// Teste de conexão com banco
sequelize.authenticate()
  .then(() => console.log("Conexão com banco estabelecida com sucesso."))
  .catch(err => console.error("Erro ao conectar no banco:", err))

// Sincronizar modelos — cria a tabela documentos_medicos se não existir
sequelize.sync()
  .then(() => console.log("Modelos sincronizados com banco."))
  .catch(err => console.error("Erro ao sincronizar modelos:", err))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
