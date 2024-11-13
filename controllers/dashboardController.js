const Profissional = require('../models/Profissional');

const checkUserAndProfissional = (req, res) => {
  if (!req.user || !req.user.profissionalId) {
      req.flash('error_msg', 'Usuário não autenticado ou profissional não associado.');
      res.redirect('/auth/login');
      return false;  
  }
  return true;  
};

const dashboardController = {
adm: async (req, res) => {
  if (!checkUserAndProfissional(req, res)) return; 

  try {
    const profissional = await Profissional.findByPk(req.user.profissionalId);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado');
      return res.redirect('/'); 
    }
    res.render('dashboard/adm', { user: req.user, cargo: profissional.cargo });
  } catch (error) {
    req.flash('error_msg', 'Erro ao carregar informações do profissional');
    res.redirect('/');
  }
},

assistenteSocial: async (req, res) => {
  if (!checkUserAndProfissional(req, res)) return;

  try {
    const profissional = await Profissional.findByPk(req.user.profissionalId);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado');
      return res.redirect('/');
    }
    res.render('dashboard/assistente-social', { user: req.user, cargo: profissional.cargo });
  } catch (error) {
    req.flash('error_msg', 'Erro ao carregar informações do profissional');
    res.redirect('/');
  }
},

psicologoPsiquiatra: async (req, res) => {
  if (!checkUserAndProfissional(req, res)) return;

  try {
    const profissional = await Profissional.findByPk(req.user.profissionalId);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado');
      return res.redirect('/');
    }
    res.render('dashboard/psicologo-psiquiatra', { user: req.user, cargo: profissional.cargo });
  } catch (error) {
    req.flash('error_msg', 'Erro ao carregar informações do profissional');
    res.redirect('/');
  }
}
};

module.exports = dashboardController;
