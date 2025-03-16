const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const Usuario = require('../models/Usuario');
const Profissional = require('../models/Profissional');
const ensureAuthenticated = require('../middlewares/ensureAuthenticated');
const argon2 = require('argon2');

// Protege a rota /register para não ser pública
router.get('/register', ensureAuthenticated, async (req, res) => {
    try {
        const profissionais = await Profissional.findAll();
        res.render('auth/register', { profissionais, layout: false });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao carregar profissionais. Tente novamente.');
        return res.redirect('/');
    }
});


router.post('/register', async (req, res) => {
    const { usuario, senha, profissionalId } = req.body;

    if (!usuario || !senha || !profissionalId) {
        req.flash('error_msg', 'Todos os campos são obrigatórios.');
        return res.redirect('/auth/register');
    }

    try {
        const existingUser = await Usuario.findOne({ where: { usuario } });
        if (existingUser) {
            req.flash('error_msg', 'Este nome de usuário já existe. Escolha outro nome.');
            return res.redirect('/auth/register');
        }

        const userForProfessional = await Usuario.findOne({ where: { profissionalId } });
        if (userForProfessional) {
            req.flash('error_msg', 'Este profissional já possui um usuário ativo.');
            return res.redirect('/auth/register');
        }

        const hashedPassword = await argon2.hash(senha);

        await Usuario.create({
            usuario,
            senha: hashedPassword,
            profissionalId,
        });

        req.flash('success_msg', 'Usuário criado com sucesso!');
        return res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao criar usuário. Tente novamente.');
        return res.redirect('/auth/register');
    }
});


router.get('/login', (req, res) => {
    const errorMsg = req.flash('error_msg');
    res.render('auth/login', { errorMsg, layout: false });
    
  });



router.post('/login', (req, res, next) => {
    console.log('Iniciando autenticação');
    authController.login(req, res, next);
  });
  

router.get('/logout', authController.logout);

router.get('/changeUsername', authController.changeUsernameView);

// Rota para processar a alteração do nome de usuário
router.post('/changeUsername', authController.changeUsername);

module.exports = router;
