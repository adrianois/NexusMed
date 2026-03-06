import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import Usuario from "../models/Usuario.js"

export const login = async (req, res) => {
  const { email, senha } = req.body

  try {
    const usuario = await Usuario.findOne({ where: { email } })
    if (!usuario) {
      return res.status(401).json({ message: "Credenciais inválidas" })
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas" })
    }

    // Access Token (expira rápido, ex.: 15 minutos)
    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    )

    // Refresh Token (expira mais tarde, ex.: 7 dias)
    const refreshToken = jwt.sign(
      { id: usuario.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    )

    return res.json({ token, refreshToken })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erro interno no servidor" })
  }
}
