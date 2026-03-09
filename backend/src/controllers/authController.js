import Usuario from "../models/Usuario.js"
import bcrypt from "bcrypt"

export const register = async (req, res) => {
  const { nome, email, senha } = req.body

  try {
    const usuarioExistente = await Usuario.findOne({ where: { email } })
    if (usuarioExistente) {
      return res.status(409).json({ message: "Email já cadastrado" })
    }

    const senhaHash = await bcrypt.hash(senha, 10)
    await Usuario.create({ nome, email, senha: senhaHash })

    return res.status(201).json({ message: "Usuário criado com sucesso" })
  } catch (err) {
    // Captura erro de constraint UNIQUE
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Email já cadastrado" })
    }
    console.error(err)
    return res.status(500).json({ message: "Erro interno no servidor" })
  }
}
