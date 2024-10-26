const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

router.get('/forgot', (req, res) => res.render('auth/forgotPassword'));
router.post('/forgot', usuarioController.requestPasswordReset);

router.get('/reset/:token', (req, res) => res.render('auth/resetPassword', { token: req.params.token }));
router.post('/reset/:token', usuarioController.resetPassword);

module.exports = router;
