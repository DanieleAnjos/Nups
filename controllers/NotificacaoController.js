// controllers/NotificacaoController.js
const Notificacao = require('../models/Notificacao');
const Profissional = require('../models/Profissional');

exports.showNotifications = async (req, res) => {
    try {
      if (!req.user) {

        req.flash('error_msg', 'Você precisa estar logado para ver as notificações.');
        return res.redirect('/login');
      }
  
      const profissionalLogado = req.user; 
      const profissionalId = profissionalLogado.id; 
  
      const notificacoes = await Notificacao.findAll({
        where: {
          profissionalId,  
          lida: false,     
        },
        order: [['dataEnvio', 'DESC']], 
      });
  
      res.render('notificacoes/index', {
        notificacoes: notificacoes.map(n => n.get({ plain: true })), 
        sucesso_msg: req.flash('success_msg'), 
        erro_msg: req.flash('error_msg'),     
      });
  
    } catch (error) {
      console.error('Erro ao exibir notificações:', error);
      req.flash('error_msg', 'Erro ao exibir as notificações.');
      res.redirect('/dashboard'); 
    }
  };
  
    exports.markAsRead = async (req, res) => {
    try {
      const { id } = req.params;
      const profissionalLogado = req.user;  // ID do profissional logado
  
      const notificacao = await Notificacao.findOne({
        where: {
          id,
          profissionalId: profissionalLogado.id,  
        },
      });
  
      if (!notificacao) {
        req.flash('error_msg', 'Notificação não encontrada ou você não tem permissão para visualizar esta notificação.');
        return res.redirect('/notificacoes');
      }
  
      notificacao.lida = true;
      await notificacao.save();
  
      req.flash('success_msg', 'Notificação marcada como lida.');
      res.redirect('/notificacoes');
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      req.flash('error_msg', 'Erro ao marcar a notificação como lida.');
      res.redirect('/notificacoes');
    }
  };