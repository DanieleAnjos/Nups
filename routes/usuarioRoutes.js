const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { Usuario } = require('../models');

router.get('/forgot',  (req, res) => res.render('auth/forgotPassword', { layout: false }));
router.post('/forgot', usuarioController.requestPasswordReset);

router.get('/resetPassword/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await Usuario.findOne({
            where: { resetToken: token }
        });

        // Validação do token
        if (!user || !user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
            return res.status(400).render('auth/login', {
                error: 'Token inválido ou expirado.',
                layout: false
            });
        }

        res.render('auth/resetPassword', { token, layout: false });
    } catch (error) {
        console.error('Erro ao carregar a página de redefinição:', error);
        res.status(500).render('auth/login', {
            error: 'Erro ao processar sua solicitação. Tente novamente.',
            layout: false
        });
    }
});



router.post('/reset/:token', usuarioController.resetPassword);

router.get('/lista', usuarioController.listUsers);

router.get('/changePassword', usuarioController.changePasswordView);
router.post('/changePassword', usuarioController.changePassword);



module.exports = router;
