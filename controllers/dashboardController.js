const Profissional = require('../models/Profissional');

const checkUserAndProfissional = (req, res) => {
  if (!req.user || !req.user.profissionalId) {
    req.flash('error_msg', 'Usuário não autenticado ou profissional não associado.');
    res.redirect('/auth/login');
    return false;
  }
  return true;
};

const loadProfissional = async (userId) => {
  try {
    return await Profissional.findByPk(userId);
  } catch (error) {
    console.error('Erro ao carregar profissional:', error);
    return null;
  }
};

const dashboardController = {
  adm: async (req, res) => {
    if (!checkUserAndProfissional(req, res)) return;

    const profissional = await loadProfissional(req.user.profissionalId);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado');
      return res.redirect('/');
    }

    res.render('dashboard/adm', { user: req.user, cargo: profissional.cargo });
  },

  assistenteSocial: async (req, res) => {
    if (!checkUserAndProfissional(req, res)) return;

    const profissional = await loadProfissional(req.user.profissionalId);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado');
      return res.redirect('/');
    }

    res.render('dashboard/assistente-social', { user: req.user, cargo: profissional.cargo });
  },

  psicologoPsiquiatra: async (req, res) => {
    if (!checkUserAndProfissional(req, res)) return;

    const profissional = await loadProfissional(req.user.profissionalId);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado');
      return res.redirect('/');
    }

    res.render('dashboard/psicologo-psiquiatra', { user: req.user, cargo: profissional.cargo });
  }
};

module.exports = dashboardController;
