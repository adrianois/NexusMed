import express from "express"
import { register, login } from "../controllers/authController.js"
import jwt from "jsonwebtoken"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)

// Refresh token
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token não fornecido" })
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const newToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    )
    return res.json({ token: newToken })
  } catch (err) {
    return res.status(403).json({ message: "Refresh token inválido" })
  }
})

export default router
