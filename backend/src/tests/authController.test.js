import { register } from "../controllers/authController.js"
import Usuario from "../models/Usuario.js"

// Mock do Sequelize/database
jest.mock("../config/database.js", () => ({
  define: jest.fn().mockReturnValue({}),
  authenticate: jest.fn(),
  sync: jest.fn()
}))

// Mock do modelo Usuario
jest.mock("../models/Usuario.js")

describe("AuthController - register", () => {
  let req, res

  beforeEach(() => {
    req = {
      body: { nome: "Teste", email: "teste@teste.com", senha: "123456" }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  it("deve registrar usuário novo com sucesso", async () => {
    Usuario.findOne.mockResolvedValue(null) // não existe no banco
    Usuario.create.mockResolvedValue({ id: 1, ...req.body })

    await register(req, res)

    expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: req.body.email } })
    expect(Usuario.create).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: "Usuário criado com sucesso" })
  })

  it("deve retornar 409 se email já existir", async () => {
    Usuario.findOne.mockResolvedValue({ id: 1, email: req.body.email })

    await register(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ message: "Email já cadastrado" })
  })

  it("deve retornar 500 em caso de erro inesperado", async () => {
    Usuario.findOne.mockRejectedValue(new Error("Erro no banco"))

    await register(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Erro interno no servidor" })
  })
})
