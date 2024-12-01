const Profissional = require('../models/Profissional');
const passport = require('passport');
const argon2 = require('argon2');

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

          try {

            const profissional = await Profissional.findByPk(user.profissionalId);

              if (!profissional) {
                  req.flash('error', 'Profissional não encontrado');
                  return res.redirect('/');
              }

              user.cargo = profissional.cargo;
              req.user = user; 

              console.log('Cargo do profissional:', profissional.cargo);

              let redirectRoute = '/dashboard/adm'; 
              if (profissional.cargo === 'Assistente social') {
                  redirectRoute = '/dashboard/assistente-social';
              } else if (profissional.cargo === 'Psicólogo' || profissional.cargo === 'Psiquiatra') {
                  redirectRoute = '/dashboard/psicologo-psiquiatra';
              }

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

exports.ensureAuthenticated = (req, res, next) => {
  console.log('Autenticação autorizada para a rota:', req.originalUrl);

  if (req.isAuthenticated()) {
      console.log('Usuário autenticado');
      const profissional = req.user; 

      if (profissional.cargo === 'Administrador') {
          console.log('Usuário é administrador');
          return next(); 
      } else if (profissional.cargo === 'Assistente social') {
          console.log('Usuário é assistente social');
          if (req.originalUrl.startsWith('/dashboard/adm')) {
              console.log('Assistente social não tem acesso ao painel de admin');
              req.flash('error', 'Você não tem permissão para acessar essa página.');
              return res.redirect('/'); 
          }
          return next(); 
      } else if (profissional.cargo === 'Psicólogo' || profissional.cargo === 'Psiquiatra') {
          console.log('Usuário é Psicólogo ou Psiquiatra');
          if (req.originalUrl.startsWith('/dashboard/adm')) {
              console.log('Psicólogo/Psiquiatra não tem acesso ao painel de admin');
              req.flash('error', 'Você não tem permissão para acessar essa página.');
              return res.redirect('/'); 
          }
          return next(); 
      } else {
          console.log('Cargo desconhecido');
          req.flash('error', 'Você não tem permissão para acessar essa página.');
          return res.redirect('/'); 
      }
  }

  console.log('Usuário não autenticado, redirecionando de volta');
  req.flash('error', 'Você precisa estar logado para acessar essa página.');
  res.redirect('/auth/login');
};


