const jwt = require('jsonwebtoken');

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // Verifica se o token está no formato 'Bearer <token>'
  
  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
}

// Middleware para verificar se é administrador
function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.cargo !== 'Administrador') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
  }
  next();
}

module.exports = { authenticateToken, authorizeAdmin };
