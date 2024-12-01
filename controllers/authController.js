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
        // Check if the profissionalId exists in the user object
        if (!user.profissionalId) {
          req.flash('error', 'Informações de profissional não encontradas.');
          return res.redirect('/auth/login');
        }

        const profissional = await Profissional.findByPk(user.profissionalId);

        if (!profissional) {
          req.flash('error', 'Profissional não encontrado.');
          return res.redirect('/');
        }

        // Assign cargo to user object
        user.cargo = profissional.cargo;
        req.user = user;

        console.log('Cargo do profissional:', profissional.cargo);

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

exports.ensureAuthenticated = (req, res, next) => {
  console.log('Autenticação autorizada para a rota:', req.originalUrl);

  if (req.isAuthenticated()) {
    console.log('Usuário autenticado');
    const profissional = req.user; 

    const roleAccess = {
      'Administrador': () => next(),
      'Assistente social': () => {
        if (req.originalUrl.startsWith('/dashboard/adm')) {
          console.log('Assistente social não tem acesso ao painel de admin');
          req.flash('error', 'Você não tem permissão para acessar essa página.');
          return res.redirect('/'); 
        }
        next();
      },
      'Psicólogo': () => {
        if (req.originalUrl.startsWith('/dashboard/adm')) {
          console.log('Psicólogo não tem acesso ao painel de admin');
          req.flash('error', 'Você não tem permissão para acessar essa página.');
          return res.redirect('/'); 
        }
        next();
      },
      'Psiquiatra': () => {
        if (req.originalUrl.startsWith('/dashboard/adm')) {
          console.log('Psiquiatra não tem acesso ao painel de admin');
          req.flash('error', 'Você não tem permissão para acessar essa página.');
          return res.redirect('/'); 
        }
        next();
      }
    };

    // Use role-based access control
    const accessControl = roleAccess[profissional.cargo];
    if (accessControl) {
      return accessControl();
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
