import jwt from "jsonwebtoken"

export const verificarToken = (req, res, next) => {
  const token = req.headers["authorization"]

  if (!token) {
    return res.status(403).json({ message: "Token não fornecido" })
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET)
    req.userId = decoded.id
    next()
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" })
  }
}
