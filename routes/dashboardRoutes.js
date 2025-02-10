const express = require('express');
const router = express.Router();
const { dashboardController, checkUserAndProfissional } = require('../controllers/dashboardController');
const Mensagem = require('../models/Mensagem');
const Notificacao = require('../models/Notificacao');

router.get('/adm', checkUserAndProfissional, async (req, res) => {
  try {
    if (!req.user || !req.user.profissionalId) {
      return res.status(401).send('Usuário não autenticado ou sem ID de profissional');
    }

    const profissionalId = req.user.profissionalId;

    const mensagensNaoLidas = await Mensagem.count({
      where: { destinatarioId: profissionalId, visualizada: false },
    });

    const notificacoesNaoLidas = await Notificacao.count({
      where: { profissionalId, lida: false },  
    });

    res.render('dashboard/adm', {
      user: req.user,
      cargo: req.profissional.cargo,
      mensagensNaoLidas,  
      notificacoesNaoLidas,  
    });
  } catch (error) {
    console.error('Erro ao carregar o painel administrativo:', error);
    res.status(500).send('Erro ao carregar o painel administrativo');
  }
});

router.get('/assistente-social', checkUserAndProfissional, async (req, res) => {
  try {
    if (!req.user || !req.user.profissionalId) {
      return res.status(401).send('Usuário não autenticado ou sem ID de profissional');
    }

    const profissionalId = req.user.profissionalId;

    const mensagensNaoLidas = await Mensagem.count({
      where: { destinatarioId: profissionalId, visualizada: false },
    });

    const notificacoesNaoLidas = await Notificacao.count({
      where: { profissionalId, lida: false },  
    });

    res.render('dashboard/assistente-social', {
      user: req.user,
      cargo: req.profissional.cargo,
      mensagensNaoLidas,  
      notificacoesNaoLidas,  
    });
  } catch (error) {
    console.error('Erro ao carregar o painel do Assistente Social:', error);
    res.status(500).send('Erro ao carregar o painel do Assistente Social');
  }
});

router.get('/psico', checkUserAndProfissional, async (req, res) => {
  try {
    if (!req.user || !req.user.profissionalId) {
      return res.status(401).send('Usuário não autenticado ou sem ID de profissional');
    }

    const profissionalId = req.user.profissionalId;

    const mensagensNaoLidas = await Mensagem.count({
      where: { destinatarioId: profissionalId, visualizada: false },
    });

    const notificacoesNaoLidas = await Notificacao.count({
      where: { profissionalId, lida: false },  
    });

    res.render('dashboard/psico', {
      user: req.user,
      cargo: req.profissional.cargo,
      mensagensNaoLidas,  
      notificacoesNaoLidas,  
    });
  } catch (error) {
    console.error('Erro ao carregar o painel do Psicólogo/Psiquiatra:', error);
    res.status(500).send('Erro ao carregar o painel do Psicólogo/Psiquiatra');
  }
});

module.exports = router;
