// Middleware de tratamento de erros
function errorHandler(err, req, res, next) {
  console.error('❌ Erro capturado:', err.message)

  // Se o erro tiver um status definido, usa ele; senão, assume 500
  const statusCode = err.status || 500

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}

module.exports = errorHandler
