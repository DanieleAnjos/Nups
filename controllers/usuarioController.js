const Usuario = require('../models/Usuario'); 
const argon2 = require('argon2');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { sequelize } = require('../models'); 

const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
});

exports.registerUser = async (req, res) => {
    try {
        const { usuario, senha, profissionalId } = req.body;

        const existingUser = await Usuario.findOne({ where: { usuario } });
        if (existingUser) {
            return res.status(400).send('Usuário já existe.');
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

        const user = await Usuario.findOne({ where: { usuario } });
        if (!user) {
            return res.status(400).send('Usuário não encontrado.');
        }

        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpires = Date.now() + 3600000; 
        await user.save();

        const resetLink = `http://localhost:3000/auth/reset/${token}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Redefinição de Senha',
            html: `
                <h1>Redefinição de Senha</h1>
                <p>Você solicitou a redefinição de senha. Clique no link abaixo para redefinir sua senha:</p>
                <a href="${resetLink}">Redefinir senha</a>
                <p>Se você não solicitou isso, ignore este e-mail.</p>
            `,
        });

        res.status(200).send('Email enviado para redefinição de senha.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao solicitar a redefinição de senha.');
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { senha } = req.body;

        const user = await Usuario.findOne({
            where: {
                resetToken: token,
                resetTokenExpires: { [sequelize.Op.gt]: Date.now() }, 
            },
        });

        if (!user) {
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

router.post('/forgot', usuarioController.requestPasswordReset);

router.post('/reset/:token', usuarioController.resetPassword);
