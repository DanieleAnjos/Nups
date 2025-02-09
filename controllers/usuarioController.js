const Usuario = require('../models/Usuario'); 
const argon2 = require('argon2');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { sequelize } = require('../models'); 
const Profissional = require('../models/Profissional');

require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // ou outro serviço de e-mail
    auth: {
      user: 'ferdinandogms@gmail.com',
      pass: 'ooyp orjc vuok kzvj'
    }
  });
  

exports.registerUser = async (req, res) => {
    try {
        const { usuario, senha, profissionalId } = req.body;

        if (!profissionalId) {
            return res.status(400).send('Profissional não selecionado.');
        }

        const existingUser = await Usuario.findOne({ where: { usuario } });
        if (existingUser) {
            return res.status(400).send('Usuário já existe.');
        }

        const profissional = await Profissional.findByPk(profissionalId);
        if (!profissional) {
            return res.status(400).send('Profissional não encontrado.');
        }

        const hashedPassword = await argon2.hash(senha);

        await Usuario.create({
            usuario,
            senha: hashedPassword,
            profissionalId,
        });

        res.status(201).send('Usuário criado com sucesso.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao criar o usuário.');
    }
};
exports.requestPasswordReset = async (req, res) => {
    try {
        const { usuario } = req.body;

        const user = await Usuario.findOne({
            where: { usuario },
            include: {
                model: Profissional,
                as: 'profissional',
                attributes: ['email'],  
            }
        });

        if (user && user.Profissional && user.Profissional.email) {
            const token = crypto.randomBytes(32).toString('hex');
            user.resetToken = token;
            user.resetTokenExpires = Date.now() + 3600000; // 1 hora
            await user.save();

            const resetLink = `http://localhost:3002/auth/reset/${token}`;

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.Profissional.email,  
                subject: 'Redefinição de Senha',
                html: `
                    <h1>Redefinição de Senha</h1>
                    <p>Clique no link abaixo para redefinir sua senha:</p>
                    <a href="${resetLink}">Redefinir senha</a>
                `,
            });
        }

        // Resposta genérica, independente de existir o usuário ou email
        return res.status(200).render('auth/forgotPassword', { 
            success: 'Enviamos um email para redefinir sua senha. Se o endereço de email estiver associado a uma conta, você poderá redefinir sua senha.',
            layout: false 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render('auth/forgotPassword', { 
            error: 'Erro ao processar sua solicitação.', 
            layout: false 
        });
    }
};


exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { senha } = req.body;

        const user = await Usuario.findOne({
            where: {
                resetToken: token
            }
        });

        if (!user || !user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
            return res.status(400).send('Token inválido ou expirado.');
        }

        const hashedPassword = await argon2.hash(senha);

        user.senha = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpires = null;
        await user.save();

        res.status(200).send('Senha redefinida com sucesso.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao redefinir a senha.');
    }
};

exports.listUsers = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            include: {
                model: Profissional,
                attributes: ['nome'],
            }
        });

        return res.render('usuarios/lista', {
            usuarios, 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send('Erro ao carregar a lista de usuários.');
    }
};


exports.changePasswordView = (req, res) => {
    res.render('auth/changePassword', { layout: false });
};

exports.changePassword = async (req, res) => {
    try {
        const { usuario, senhaAtual, novaSenha } = req.body;

        const user = await Usuario.findOne({ where: { usuario } });
        if (!user) {
            return res.status(400).render('auth/changePassword', {
                error: 'Usuário não encontrado.',
                layout: false
            });
        }

        const senhaCorreta = await argon2.verify(user.senha, senhaAtual);
        if (!senhaCorreta) {
            return res.status(400).render('auth/changePassword', {
                error: 'Senha atual incorreta.',
                layout: false
            });
        }

        const hashedNewPassword = await argon2.hash(novaSenha);
        user.senha = hashedNewPassword;
        await user.save();

        return res.status(200).render('auth/changePassword', {
            success: 'Senha alterada com sucesso.',
            layout: false
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render('auth/changePassword', {
            error: 'Erro ao alterar a senha.',
            layout: false
        });
    }
};
