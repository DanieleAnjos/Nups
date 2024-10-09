const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const Profissional = require('../models/Profissional');

exports.login = async (req, res) => {
    const { usuario, senha } = req.body;

    console.log(`Tentativa de login com usuário: ${usuario}`); 

    try {
        const profissional = await Profissional.findOne({ where: { usuario } });

        if (!profissional) {
            console.log('Usuário não encontrado.'); 
            req.flash('error_msg', 'Usuário não encontrado.');
            return res.redirect('/auth/login');
        }

        const isPasswordValid = await argon2.verify(profissional.senha, senha);

        console.log('Hash armazenado:', profissional.senha);
        console.log('Senha fornecida:', senha);
        console.log('Senha válida?', isPasswordValid);
        
        if (!isPasswordValid) {
            console.error(`Falha no login. Usuário: ${usuario}, Senha fornecida: ${senha}`);
        }
        

        const token = jwt.sign(
            { id: profissional.id, usuario: profissional.usuario, cargo: profissional.cargo },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1h' }
        );

        res.cookie('token', token, { httpOnly: true });

        req.flash('success_msg', 'Login realizado com sucesso.');
        return res.redirect('/profissionais');
    } catch (error) {
        console.error('Erro no login:', error);
        req.flash('error_msg', 'Ocorreu um erro ao tentar fazer login.');
        return res.redirect('/auth/login');
    }
};
