import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import sequelize from "./config/database.js"
import authRoutes from "./routes/authRoutes.js"

dotenv.config()

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Rotas
app.use("/auth", authRoutes)

// Teste de conexão com banco
sequelize.authenticate()
  .then(() => {
    console.log("Conexão com banco estabelecida com sucesso.")
  })
  .catch(err => {
    console.error("Erro ao conectar no banco:", err)
  })

// Sincronizar modelos (opcional: { force: true } recria tabelas)
sequelize.sync()
  .then(() => {
    console.log("Modelos sincronizados com banco.")
  })
  .catch(err => {
    console.error("Erro ao sincronizar modelos:", err)
  })

// Inicializar servidor
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
