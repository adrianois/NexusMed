import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET || 'segredo_super_seguro'

export function autenticar(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.sendStatus(401)
  jwt.verify(token, jwtSecret, (err, payload) => {
    if (err) return res.sendStatus(403)
    req.usuario = payload
    next()
  })
}

export function apenasAdmin(req, res, next) {
  if (req.usuario?.perfil !== 'admin')
    return res.status(403).json({ error: 'Acesso restrito a administradores.' })
  next()
}

export function apenasGestor(req, res, next) {
  if (!['admin', 'gestor'].includes(req.usuario?.perfil))
    return res.status(403).json({ error: 'Acesso restrito a gestores.' })
  next()
}

export function gerarToken(usuario) {
  return jwt.sign(
    { usuario_id: usuario.id, nome: usuario.nome, email: usuario.email,
      perfil: usuario.perfil, clinica_id: usuario.clinica_id, status: usuario.status },
    jwtSecret,
    { expiresIn: '8h' }
  )
}
