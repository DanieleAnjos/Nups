const Usuario = require('../models/Usuario'); 
const argon2 = require('argon2');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { sequelize } = require('../models'); 
const Profissional = require('../models/Profissional');

require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: 'ferdinandogms@gmail.com',
      pass: 'ooyp orjc vuok kzvj'
    }
  });
  

  exports.registerUser = async (req, res) => {
    try {
        const { usuario, senha, profissionalId } = req.body;

        if (!profissionalId) {
            return res.render('auth/register', {
                error: 'Profissional não selecionado.'
            });
        }

        const existingUser = await Usuario.findOne({ where: { usuario } });
        if (existingUser) {
            return res.render('auth/register', {
                error: 'Usuário já existe.'
            });
        }

        const profissional = await Profissional.findByPk(profissionalId);
        if (!profissional) {
            return res.render('auth/register', {
                error: 'Profissional não encontrado.'
            });
        }

        // Verifica se já existe um usuário associado a esse profissional
        const existingUserForProfissional = await Usuario.findOne({ where: { profissionalId } });
        if (existingUserForProfissional) {
            return res.render('auth/register', {
                error: 'Este profissional já possui um usuário cadastrado.'
            });
        }

        const hashedPassword = await argon2.hash(senha);

        await Usuario.create({
            usuario,
            senha: hashedPassword,
            profissionalId,
        });

        console.log('Usuário criado com sucesso.');

        return res.render('auth/login', {
            success: 'Usuário criado com sucesso! Faça login para continuar.'
        });

    } catch (error) {
        console.error(error);
        return res.render('auth/register', {
            error: 'Erro ao criar o usuário. Tente novamente.'
        });
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
                attributes: ['email', 'nome'],
            }
        });

        // Verifica se o usuário e o e-mail do profissional existem
        if (!user || !user.profissional || !user.profissional.email) {
            return res.status(200).render('auth/forgotPassword', { 
                success: 'Enviamos um email para redefinir sua senha. Se o endereço de email estiver associado a uma conta, você poderá redefinir sua senha.',
                layout: false 
            });
        }

        // Gera o token de redefinição
        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpires = Date.now() + 3600000; // Expira em 1 hora
        console.log("Tempo atual:", Date.now());
        console.log("Expiração salva:", user.resetTokenExpires);
        await user.save();

        const resetLink = `http://localhost:3000/auth/resetPassword/${token}`;

        // Verifica a configuração do servidor SMTP antes de enviar
        try {
            await transporter.verify();
        } catch (smtpError) {
            console.error('Erro ao conectar ao SMTP:', smtpError);
            return res.status(500).render('auth/forgotPassword', {
                error: 'Erro ao enviar email. Tente novamente mais tarde.',
                layout: false 
            });
        }

        // Enviar e-mail
        try {
            let info = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.profissional.email,  
                subject: 'Redefinição de Senha',
                html: `
                <h1 style="color: #297FB8; font-family: Arial, sans-serif; font-size: 24px; margin: 0 0 20px 0; text-align: center;">Redefinição de Senha</h1>
                <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333333; margin: 0 0 20px 0;">Olá, ${user.profissional.nome}</p>
                <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333333; margin: 0 0 20px 0;">Recebemos uma solicitação para redefinir a senha da sua conta. Para continuar com o processo, clique no botão abaixo:</p>
                <p style=" margin: 20px 0;">
                    <a href="${resetLink}" style="background-color: #297FB8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-family: Arial, sans-serif; display: inline-block;">Redefinir Senha</a>
                </p>
                <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333333; margin: 0 0 20px 0;">Se você não solicitou a redefinição de senha, por favor, ignore este e-mail. Sua senha atual permanecerá inalterada.</p>
                <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333333; margin: 0 0 20px 0;">Caso tenha alguma dúvida ou precise de ajuda, não hesite em entrar em contato conosco.</p>
                <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333333; margin: 0 0 20px 0;">Atenciosamente, <strong> Equipe de Suporte - Nups</strong></p>
                <p style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; text-align: center; margin: 20px 0 0 0;">Este é um e-mail automático, por favor não responda diretamente a esta mensagem.</p>
                `,
            });

            console.log('Email enviado com sucesso:', info.messageId);
        } catch (emailError) {
            console.error('Erro ao enviar email:', emailError);
            return res.status(500).render('auth/forgotPassword', { 
                error: 'Erro ao enviar email. Tente novamente mais tarde.', 
                layout: false 
            });
        }

        return res.status(200).render('auth/forgotPassword', { 
            success: 'Enviamos um email para redefinir sua senha. Se o endereço de email estiver associado a uma conta, você poderá redefinir sua senha.',
            layout: false 
        });

    } catch (error) {
        console.error('Erro no processo de redefinição de senha:', error);
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

        const senhaRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // Verifica se a senha foi fornecida e se atende aos critérios
        if (!senha || !senha.trim().match(senhaRegex)) {
            return res.status(400).render('auth/resetPassword', {
                error: 'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&).'
            });
        }

        const user = await Usuario.findOne({
            where: {
                resetToken: token
            }
        });

        if (!user || !user.resetTokenExpires || new Date(user.resetTokenExpires).getTime() < Date.now()) {
            return res.status(400).render('auth/login', {
                error: 'Token inválido ou expirado.'
            });
        }

        // Criptografa a nova senha antes de salvar
        const hashedPassword = await argon2.hash(senha.trim());

        // Atualiza o usuário com a nova senha e remove o token
        user.senha = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpires = null;

        await user.save();
        
        console.log('Senha redefinida com sucesso.');
        return res.render('auth/login', { 
            success: 'Senha redefinida com sucesso!',
            layout: false
        });
    } catch (error) {
        console.error('Erro ao redefinir a senha:', error);
        return res.status(500).render('auth/resetPassword', { error: 'Erro ao redefinir senha. Tente novamente.', layout: false});
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

        return res.status(200).render('auth/login', {
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
