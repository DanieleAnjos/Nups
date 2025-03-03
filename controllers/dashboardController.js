const Profissional = require('../models/Profissional');

const checkUserAndProfissional = async (req, res, next) => {
  if (!req.user || !req.user.profissionalId) {
    req.flash('error_msg', 'Usuário não autenticado ou profissional não associado.');
    return res.redirect('/auth/login');
  }

  try {
    const profissional = await Profissional.findByPk(req.user.profissionalId);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado');
      return res.redirect('/');
    }
    req.profissional = profissional;
    next();
  } catch (error) {
    console.error('Erro ao carregar profissional:', error);
    req.flash('error_msg', 'Erro ao carregar os dados do profissional');
    return res.redirect('/');
  }
};

const dashboardController = {

  adm: (req, res) => {
    console.log(req.user);
    res.render('dashboard/adm2', { user: req.user, cargo: req.profissional.cargo });
  },
  administrador: (req, res) => {
    console.log(req.user);
    res.render('dashboard/adm', { user: req.user, cargo: req.profissional.cargo });
  },
  assistenteSocial: (req, res) => {
    console.log(req.user);
    res.render('dashboard/assistente-social', { user: req.user, cargo: req.profissional.cargo });
  },

  psicologoPsiquiatra: (req, res) => {
    console.log(req.user);
    res.render('dashboard/psico', { user: req.user, cargo: req.profissional.cargo });
  }
};

module.exports = {
  dashboardController,
  checkUserAndProfissional
};