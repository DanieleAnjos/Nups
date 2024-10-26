const Profissional = require('../models/Profissional');
const passport = require('passport');
const argon2 = require('argon2');

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
      if (err) {
          console.error('Erro na autenticação:', err);
          return next(err); 
      }
      if (!user) {
          console.log('Usuário não encontrado ou senha incorreta');
          req.flash('error_msg', 'Usuário não encontrado ou senha incorreta'); 
          return res.redirect('/auth/login'); 
      }
      req.logIn(user, (err) => {
          if (err) {
              console.error('Erro ao fazer login:', err);
              return next(err); 
          }
          return res.redirect('/dashboard/adm'); 
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
    return next(); 
  }
  
  console.log('Usuário não autenticado, redirecionando de volta');
  req.flash('error_msg', 'Você precisa estar logado para acessar essa página.'); 
  res.redirect('/auth/login'); 
};
