const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  
  
  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
}

function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.cargo !== 'Administrador') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
  }
  next();
}

module.exports = { authenticateToken, authorizeAdmin };
