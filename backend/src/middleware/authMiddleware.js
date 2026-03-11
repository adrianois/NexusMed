import jwt from 'jsonwebtoken';

/**
 * Middleware de verificação do token JWT.
 * Adiciona req.usuario com os dados do médico autenticado.
 */
export function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}
