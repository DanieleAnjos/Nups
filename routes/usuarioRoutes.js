const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

router.get('/forgot',  (req, res) => res.render('auth/forgotPassword', { layout: false }));
router.post('/forgot', usuarioController.requestPasswordReset);

router.get('/reset/:token', (req, res) => res.render('auth/resetPassword', { token: req.params.token,  layout: false }));
router.post('/reset/:token', usuarioController.resetPassword);

router.get('/lista', usuarioController.listUsers);

router.get('/changePassword', usuarioController.changePasswordView);
router.post('/changePassword', usuarioController.changePassword);



module.exports = router;
