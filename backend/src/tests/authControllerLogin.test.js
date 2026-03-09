import { login } from "../controllers/authController.js"
import Usuario from "../models/Usuario.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

// Mock do Sequelize/database
jest.mock("../config/database.js", () => ({
  define: jest.fn().mockReturnValue({}),
  authenticate: jest.fn(),
  sync: jest.fn()
}))

// Mock do modelo Usuario
jest.mock("../models/Usuario.js")

// Mock do bcrypt e jwt
jest.mock("bcrypt")
jest.mock("jsonwebtoken")

describe("AuthController - login", () => {
  let req, res

  beforeEach(() => {
    req = {
      body: { email: "teste@teste.com", senha: "123456" }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    jest.clearAllMocks()
  })

  it("deve retornar 401 se usuário não existir", async () => {
    Usuario.findOne.mockResolvedValue(null)

    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: "Credenciais inválidas" })
  })

  it("deve retornar 401 se senha for inválida", async () => {
    Usuario.findOne.mockResolvedValue({ id: 1, email: req.body.email, senha: "hash" })
    bcrypt.compare.mockResolvedValue(false)

    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: "Credenciais inválidas" })
  })

  it("deve retornar token e refreshToken se login for válido", async () => {
    Usuario.findOne.mockResolvedValue({ id: 1, email: req.body.email, senha: "hash" })
    bcrypt.compare.mockResolvedValue(true)
    jwt.sign
      .mockReturnValueOnce("fakeAccessToken") // primeiro token
      .mockReturnValueOnce("fakeRefreshToken") // segundo token

    await login(req, res)

    expect(res.json).toHaveBeenCalledWith({
      token: "fakeAccessToken",
      refreshToken: "fakeRefreshToken"
    })
  })

  it("deve retornar 500 em caso de erro inesperado", async () => {
    Usuario.findOne.mockRejectedValue(new Error("Erro no banco"))

    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Erro interno no servidor" })
  })
})
