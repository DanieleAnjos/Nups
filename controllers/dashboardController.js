const Profissional = require('../models/Profissional');
const Mensagem = require('../models/Mensagem');
const Notificacao = require('../models/Notificacao');



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
  // Método para renderizar o dashboard de administradores
  adm: async (req, res) => {
    try {
      const userId = req.user.id; // ID do usuário autenticado

      // Contando as mensagens não lidas
      const mensagensNaoLidas = await Mensagem.count({
        where: {
          destinatarioId: userId,
          visualizada: false
        }
      });

      // Renderizando a view com os dados necessários
      res.render('dashboard/adm', {
        user: req.user,
        cargo: req.profissional.cargo,
        mensagensNaoLidas      });
    } catch (error) {
      console.error('Erro ao carregar dashboard de administrador', error);
      res.status(500).send('Erro ao carregar dashboard');
    }
  },

  // Método para renderizar o dashboard do assistente social
  assistenteSocial: async (req, res) => {
    try {
      const userId = req.user.id;

      // Contando as mensagens não lidas
      const mensagensNaoLidas = await Mensagem.count({
        where: {
          destinatarioId: userId,
          visualizada: false
        }
      });

      res.render('dashboard/assistente-social', {
        user: req.user,
        cargo: req.profissional.cargo,
        mensagensNaoLidas      });
    } catch (error) {
      console.error('Erro ao carregar dashboard de assistente social', error);
      res.status(500).send('Erro ao carregar dashboard');
    }
  },

  // Método para renderizar o dashboard do psicólogo ou psiquiatra
  psicologoPsiquiatra: async (req, res) => {
    try {
      const userId = req.user.id;

      // Contando as mensagens não lidas
      const mensagensNaoLidas = await Mensagem.count({
        where: {
          destinatarioId: userId,
          visualizada: false
        }
      });

      res.render('dashboard/psicologo-psiquiatra', {
        user: req.user,
        cargo: req.profissional.cargo,
        mensagensNaoLidas
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard de psicólogo/psiquiatra', error);
      res.status(500).send('Erro ao carregar dashboard');
    }
  }
};


module.exports = {
  dashboardController,
  checkUserAndProfissional
};
