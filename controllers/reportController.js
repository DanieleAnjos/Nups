const Ocorrencia = require('../models/Ocorrencia');
const Profissional = require('../models/Profissional');
const Escala = require('../models/Escala');
const puppeteer = require('puppeteer'); 
const { Op } = require('sequelize'); 
const ExcelJS = require('exceljs'); // Importa a biblioteca exceljs


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

  gerarRelatorioEscalasExcel: async (req, res) => {
    try {
      const { data, profissional } = req.query;

      const whereConditions = {};
      if (data) {
        whereConditions.data = { [Op.eq]: new Date(data) };
      }
      if (profissional) {
        whereConditions.profissionalId = profissional;
      }

      const escalas = await Escala.findAll({
        where: whereConditions,
        include: [{ model: Profissional, as: 'admin' }]
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Escalas');

      worksheet.columns = [
        { header: 'Data', key: 'data', width: 15 },
        { header: 'Horário Início', key: 'horarioInicio', width: 15 },
        { header: 'Horário Fim', key: 'horarioFim', width: 15 },
        { header: 'Profissional', key: 'profissional', width: 30 },
      ];

      escalas.forEach(escala => {
        worksheet.addRow({
          data: escala.data.toISOString().split('T')[0],
          horarioInicio: escala.horarioInicio,
          horarioFim: escala.horarioFim,
          profissional: escala.admin.nome,
        });
      });

      worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2980b9' } };
      worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_escalas.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Erro ao gerar o relatório em Excel:', error);
      res.status(500).send('Erro ao gerar o relatório em Excel');
    }
  },
};



module.exports = reportController;
