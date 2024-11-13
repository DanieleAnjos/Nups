const Ocorrencia = require('../models/Ocorrencia');
const Profissional = require('../models/Profissional');
const Escala = require('../models/Escala');
const puppeteer = require('puppeteer'); 
const { Op } = require('sequelize'); 

const reportController = {
  index: async (req, res) => {
          try {
            const reports = [
              {
                title: 'Relatório de Escalas',
                description: 'Relatório com as escalas de profissionais.',
                downloadLink: '/escalas/relatorio', 
                print: '/escalas/viewReport',
              },
              {
                title: 'Relatório de Ocorrências',
                description: 'Relatório com as ocorrências registradas.',
                downloadLink: '/ocorrencias/relatorio', 
                print: '/ocorrencias/viewReport', 
              },
              {
                title: 'Relatório de Reserva de Salas',
                description: 'Relatório com as reservas registradas.',
                downloadLink: '/reservas/relatorio', 
                print: '/reservas/viewReport',
              },
              {
                title: 'Relatório de Profissionais',
                description: 'Relatório dos Profissionais Cadastrados.',
                downloadLink: '/profissional/relatorio', 
                print: '/profissionais/viewReport',
              },
            ];

      res.render('relatorios/index', { reports });
    } catch (error) {
      console.error('Erro ao carregar a página de relatórios:', error);
      res.status(500).send('Erro ao carregar a página de relatórios.');
    }
  },
};


module.exports = reportController;
