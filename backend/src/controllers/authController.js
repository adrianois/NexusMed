import Usuario from "../models/Usuario.js"
import bcrypt from "bcrypt"

// ✅ CORREÇÃO: função login completa com token e refreshToken
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

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    )

    const refreshToken = jwt.sign(
      { id: usuario.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    )

    return res.json({ token, refreshToken, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erro interno no servidor" })
  }
}