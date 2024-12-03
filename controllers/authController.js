const Profissional = require('../models/Profissional');
const passport = require('passport');
const argon2 = require('argon2');
const { checkProfissional } = require('../utils');  // Ajuste o caminho conforme necessário


exports.login = (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      console.error('Erro na autenticação:', err);
      return next(err);
    }
    if (!user) {
      console.log('Usuário não encontrado ou senha incorreta');
      req.flash('error', 'Usuário não encontrado ou senha incorreta');
      return res.redirect('/auth/login');
    }

    req.logIn(user, async (err) => {
      if (err) {
        console.error('Erro ao fazer login:', err);
        return next(err);
      }

      console.log('Sessão após login:', req.session);
    
      try {
        const profissional = await checkProfissional(user); // Reutilizando a função

        // Atribuir cargo ao usuário
        user.cargo = profissional.cargo;
        req.user = user;

        console.log('Cargo do profissional:', profissional.cargo);

        // Mapeamento de cargos para rotas
        const roleToRoute = {
          'Administrador': '/dashboard/adm',
          'Assistente social': '/dashboard/assistente-social',
          'Psicólogo': '/dashboard/psicologo-psiquiatra',
          'Psiquiatra': '/dashboard/psicologo-psiquiatra'
        };

        const redirectRoute = roleToRoute[profissional.cargo] || '/dashboard/adm';

        console.log('Redirecionando para:', redirectRoute);
        return res.redirect(redirectRoute);

      } catch (error) {
        console.error('Erro ao buscar o profissional:', error);
        req.flash('error', 'Erro ao verificar o cargo do profissional.');
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
    res.redirect('/');
  });
};

// Helper function to check role-based access
function checkAccess(role, restrictedRoute, req, res, next) {
  if (req.originalUrl.startsWith(restrictedRoute)) {
    console.log(`${role} não tem acesso ao painel de admin`);
    req.flash('error', 'Você não tem permissão para acessar essa página.');
    return res.redirect('/');
  }
  next();
}
