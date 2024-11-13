// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token; 

    if (!token) {
        return res.status(401).redirect('/auth/login'); 
    }

    jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
        if (err) {
            return res.status(403).redirect('/auth/login'); 
        }
        req.user = user; 
        next(); 
    });
};

module.exports = authenticateJWT;
