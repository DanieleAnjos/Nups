// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token; // Supondo que você armazene o token em um cookie

    if (!token) {
        return res.status(401).redirect('/auth/login'); // Redirecionar se não houver token
    }

    jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
        if (err) {
            return res.status(403).redirect('/auth/login'); // Redirecionar se o token não for válido
        }
        req.user = user; // Armazenar informações do usuário na requisição
        next(); // Continue para a próxima função
    });
};

module.exports = authenticateJWT;
