const express = require('express');
const router = express.Router();
const { dashboardController, checkUserAndProfissional } = require('../controllers/dashboardController');
const Mensagem = require('../models/Mensagem');

router.get('/adm', checkUserAndProfissional, async (req, res) => {
    try {
      // Obtendo o ID do usuário logado (ou o ID do profissional, dependendo do seu modelo)
      const userId = req.user.id || req.profissional.id; // Ajuste conforme sua estrutura de dados
  
      // Consultando o número de mensagens não lidas
      const mensagensNaoLidas = await Mensagem.count({
        where: {
          destinatarioId: userId,
          visualizada: false
        }
      });
  
  
      // Renderizando a página e passando os dados para a view
      res.render('dashboard/adm', {
        user: req.user,
        cargo: req.profissional.cargo,
        mensagensNaoLidas,  // Passando a contagem de mensagens não lidas
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao carregar o dashboard');
    }
  });
  
  router.get('/assistente-social', checkUserAndProfissional, dashboardController.assistenteSocial);
router.get('/psicologo-psiquiatra', checkUserAndProfissional, dashboardController.psicologoPsiquiatra);

module.exports = router;
