// Mock do Sequelize para testes
export default {
  define: jest.fn().mockReturnValue({}),
  authenticate: jest.fn(),
  sync: jest.fn()
}
