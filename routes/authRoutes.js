const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', (req, res) => {
    res.render('auth/login'); 
});

router.post('/login', authController.login);

router.post('/register-admin', authController.registerAdmin);

router.get('/logout', authController.logout)

router.get('/logout', (req, res) => {
    res.clearCookie('token'); 
    req.flash('success_msg', 'Você foi desconectado com sucesso.');
    res.redirect('/auth/login'); 
});

module.exports = router;
