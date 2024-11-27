const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Usuario = require('../models/Usuario'); 
const argon2 = require('argon2');
const Profissional = require('../models/Profissional');

passport.use(new LocalStrategy({
    usernameField: 'usuario',
    passwordField: 'senha'
}, async (usuario, senha, done) => {
    try {
        const user = await Usuario.findOne({ where: { usuario } });

        if (!user) {
            console.log('Usuário não encontrado:', usuario);
            return done(null, false, { message: 'Usuário não encontrado' });
        }

        const isMatch = await argon2.verify(user.senha, senha);
        if (!isMatch) {
            console.log('Senha incorreta para o usuário:', usuario);
            return done(null, false, { message: 'Senha incorreta' });
        }

        console.log('Usuário autenticado com sucesso:', usuario);
        return done(null, user);
    } catch (error) {
        console.error('Erro durante a autenticação:', error);
        return done(error);
    }
}));


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await Usuario.findByPk(id, {
            include: {
                model: Profissional,
                attributes: ['cargo']  // Certifique-se de incluir o cargo aqui
            }
        });
        if (user && user.Profissional) {
            user.cargo = user.Profissional.cargo; // Atribui o cargo ao objeto do usuário
        }
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});


module.exports = passport;