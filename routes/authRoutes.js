const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const Usuario = require('../models/Usuario');
const Profissional = require('../models/Profissional');
const argon2 = require('argon2');

router.get('/register', async (req, res) => {
    try {
        const profissionais = await Profissional.findAll();
        res.render('auth/register', { profissionais }); 
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
            req.flash('error_msg', 'Usuário já existe. Escolha outro nome.');
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
    res.render('auth/login', { errorMsg , layout: false });
});

router.post('/login', authController.login);


router.get('/logout', authController.logout);

module.exports = router;
