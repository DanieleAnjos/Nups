const Profissional = require('../models/Profissional');
const Usuario = require('../models/Usuario');
const passport = require('passport');
const argon2 = require('argon2');
const { checkProfissional } = require('../utils');


exports.login = (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      console.error('Erro na autenticação:', err);
      req.flash('error_msg', 'Erro na autenticação');
      return next(err);
    }
    if (!user) {
      console.log('Usuário não encontrado ou senha incorreta');
      req.flash('error_msg', 'Usuário não encontrado ou senha incorreta');
      return res.redirect('/auth/login');
    }

    req.logIn(user, async (err) => {
      if (err) {
        console.error('Erro ao fazer login:', err);
        return next(err);
      }

      console.log('Sessão após login:', req.session);
    
      try {
        const profissional = await checkProfissional(user); 
        if (!profissional) {
          req.flash('error_msg', 'Profissional não encontrado.');
          return res.redirect('/auth/login');
        }

        user.cargo = profissional.cargo;
        req.user = user;

        console.log('Cargo do profissional:', profissional.cargo);

        const roleToRoute = {
          'Administrador': '/dashboard/adm',
          'Adm' : '/dashboard/adm2',
          'Gestor Adms' : '/dashboard/admGestor',
          'Gestor Psicologia' : '/dashboard/psicoGestor',
          'Gestor Psiquiatra' : '/dashboard/psiquiGestor',
          'Gestor Servico Social' : '/dashboard/socialGestor',
          'Assistente social': '/dashboard/assistente-social',
          'Psicólogo': '/dashboard/psico',
          'Psiquiatra': '/dashboard/psico'
        };

        const redirectRoute = roleToRoute[profissional.cargo] || '/dashboard/adm';

        console.log('Redirecionando para:', redirectRoute);
        return res.redirect(redirectRoute);

      } catch (error) {
        console.error('Erro ao buscar o profissional:', error);
        req.flash('error_msg', 'Erro ao verificar o cargo do profissional.');
        return res.redirect('/');
      }
    });    
  })(req, res, next);
};


exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
      return next(err);
    }
    req.flash('success_msg', 'Logout realizado com sucesso.');
    res.redirect('/auth/login');
  });
};

function checkAccess(role, restrictedRoute, req, res, next) {
  if (req.originalUrl.startsWith(restrictedRoute)) {
    console.log(`${role} não tem acesso ao painel de admin`);
    req.flash('error_msg', 'Você não tem permissão para acessar essa página.');
    return res.redirect('/');
  }
  next();
}

// controllers/authController.js

// Exibir a view de alteração do nome de usuário
exports.changeUsernameView = (req, res) => {
  res.render('auth/changeUsername', { layout: false });
};

// Processar a alteração do nome de usuário
exports.changeUsername = async (req, res) => {
  try {
      const { usuarioAtual, novoUsuario, senha } = req.body;

      // Verifica se o usuário atual existe
      const user = await Usuario.findOne({ where: { usuario: usuarioAtual } });
      if (!user) {
          return res.status(400).render('auth/changeUsername', {
              error: 'Usuário atual não encontrado.',
              layout: false
          });
      }

      // Verifica se a senha está correta
      const senhaCorreta = await argon2.verify(user.senha, senha);
      if (!senhaCorreta) {
          return res.status(400).render('auth/changeUsername', {
              error: 'Senha incorreta.',
              layout: false
          });
      }

      // Verifica se o novo nome de usuário já está em uso
      const existingUser = await Usuario.findOne({ where: { usuario: novoUsuario } });
      if (existingUser) {
          return res.status(400).render('auth/changeUsername', {
              error: 'O novo nome de usuário já está em uso.',
              layout: false
          });
      }

      // Atualiza o nome de usuário
      user.usuario = novoUsuario;
      await user.save();

      return res.status(200).render('auth/login', {
          success: 'Nome de usuário alterado com sucesso. Faça login novamente.',
          layout: false
      });
  } catch (error) {
      console.error(error);
      return res.status(500).render('auth/changeUsername', {
          error: 'Erro ao alterar o nome de usuário.',
          layout: false
      });
  }
};