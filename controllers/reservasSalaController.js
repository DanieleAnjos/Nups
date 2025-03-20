const ReservaSala = require('../models/ReservaSala');
const Sala = require('../models/Sala');
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize');
const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const excel = require('exceljs');


const reservasSalaController = {
    listarReservas: async (req, res) => {
      try {
        const { dataInicio, dataFim, salaId, profissionalId } = req.query;
        const where = {};
    
        if (dataInicio && dataFim) {
          where.data = {
            [Op.between]: [dataInicio, dataFim], 
          };
        } else if (dataInicio) {
          where.data = {
            [Op.gte]: dataInicio,
          };
        } else if (dataFim) {
          where.data = {
            [Op.lte]: dataFim, 
          };
        }
    
        if (salaId) {
          where.salaId = salaId;
        }
    
        if (profissionalId) {
          where.profissionalId = profissionalId;
        }
    
        const reservas = await ReservaSala.findAll({
          where,
          include: [
            { model: Sala, as: 'sala' },
            { model: Profissional, as: 'profissional' },
          ],
          order: [['data', 'DESC']],
        });
  
        const profissionalLogado = req.user.profissionalId || {};
        const cargo = profissionalLogado.cargo ? profissionalLogado.cargo.toLowerCase() : "";
  
        const reservasComPermissoes = reservas.map(reserva => {
          const profissionalNome = reserva.profissional ? reserva.profissional.nome : 'N/A';
          const podeEditar = cargo === "administrador" || reserva.profissionalId === profissionalLogado.id;
          const podeDeletar = cargo === "administrador" || reserva.profissionalId === profissionalLogado.id;
          
          return {
            ...reserva.toJSON(),
            profissionalNome,
            podeEditar,
            podeDeletar,
          };
        });
    
        const salas = await Sala.findAll();
        const profissionais = await Profissional.findAll();
        
        res.render('reservas', {
          reservas: reservasComPermissoes,
          errorMessage: req.flash('error'),
          successMessage: req.flash('success'),
          query: req.query,
          salas,
          profissionais,
        });
      } catch (error) {
        console.error('Erro ao listar reservas:', error);
        req.flash('error', 'Erro ao listar reservas.');
        res.redirect('/reservas');
      }
    },
  
  

  formCriarReserva: async (req, res) => {
    try {
      const salas = await Sala.findAll();
      const profissionais = await Profissional.findAll();
      res.render('reservas/create', { salas, profissionais, errorMessage: req.flash('error') });
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
      req.flash('error_msg', 'Erro ao carregar salas.');
      res.redirect('/reservas');
    }
  },

  criarReserva: async (req, res) => {
    try {
      const { salaId, data, horarioInicial, horarioFinal, profissionalId } = req.body;

      if (!salaId || !data || !horarioInicial || !horarioFinal || !profissionalId) {
        req.flash('error', 'Todos os campos são obrigatórios.');
        return res.redirect('/reservas/create');
      }

      const inicial = new Date(`${data}T${horarioInicial}:00Z`);
      const final = new Date(`${data}T${horarioFinal}:00Z`);
      if (inicial >= final) {
        req.flash('error', 'O horário inicial deve ser anterior ao horário final.');
        return res.redirect('/reservas/create');
      }

      const conflitos = await ReservaSala.findOne({
        where: {
          salaId,
          data,
          [Op.or]: [
            {
              horarioInicial: {
                [Op.lt]: final,
              },
              horarioFinal: {
                [Op.gt]: inicial,
              },
            },
          ],
        },
      });

      if (conflitos) {
        req.flash('error_msg', 'Já existe uma reserva para esta sala neste dia e horário.');
        return res.redirect('/reservas/create');
      }

      await ReservaSala.create(req.body);
      req.flash('success_msg', 'Reserva criada com sucesso!');
      res.redirect('/reservas');
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      req.flash('error_msg', 'Erro ao criar reserva.');
      res.redirect('/reservas/create');
    }
  },

  formEditarReserva: async (req, res) => {
    try {
      const reserva = await ReservaSala.findByPk(req.params.id, {
        include: [{ model: Sala, as: 'sala' }, { model: Profissional, as: 'profissional' }]
      });
      const salas = await Sala.findAll();
      const profissionais = await Profissional.findAll();

      if (!reserva) {
        req.flash('error_msg', 'Reserva não encontrada.');
        return res.redirect('/reservas');
      }

      res.render('reservas/edit', { reserva, salas, profissionais, errorMessage: req.flash('error') });
    } catch (error) {
      console.error('Erro ao carregar reserva:', error);
      req.flash('error_msg', 'Erro ao carregar reserva.');
      res.redirect('/reservas');
    }
  },

  atualizarReserva: async (req, res) => {
    try {
      const { salaId, data, horarioInicial, horarioFinal } = req.body;
  
      const inicial = new Date(`${data}T${horarioInicial}:00Z`);
      const final = new Date(`${data}T${horarioFinal}:00Z`);
  
      // Validação do horário
      if (inicial >= final) {
        req.flash('error_msg', 'O horário inicial deve ser anterior ao horário final.');
        return res.redirect(`/reservas/${req.params.id}/edit`);
      }
  
      // Verificação de conflitos com outras reservas
      const conflitos = await ReservaSala.findOne({
        where: {
          salaId,
          data,
          id: { [Op.ne]: req.params.id }, // Ignora a própria reserva que está sendo atualizada
          [Op.or]: [
            {
              // Caso o horário inicial da reserva se sobreponha ao intervalo de outra
              horarioInicial: {
                [Op.lt]: final,
              },
              horarioFinal: {
                [Op.gt]: inicial,
              },
            },
          ],
        },
      });
  
      if (conflitos) {
        req.flash('error_msg', 'Já existe uma reserva para esta sala neste dia e horário.');
        return res.redirect(`/reservas/${req.params.id}/edit`);
      }
  
      // Atualiza a reserva
      const [updated] = await ReservaSala.update(req.body, { where: { id: req.params.id } });
  
      if (updated) {
        req.flash('success_msg', 'Reserva atualizada com sucesso!');
        return res.redirect('/reservas');
      }
  
      // Caso a reserva não seja encontrada
      req.flash('error_msg', 'Reserva não encontrada.');
      res.redirect('/reservas');
    } catch (error) {
      console.error('Erro ao atualizar reserva:', error);
      req.flash('error_msg', 'Erro ao atualizar reserva.');
      res.redirect('/reservas');
    }
  },
  

  deletarReserva: async (req, res) => {
    try {
      const deleted = await ReservaSala.destroy({ where: { id: req.params.id } });
      if (deleted) {
        req.flash('success_msg', 'Reserva deletada com sucesso!');
        return res.redirect('/reservas');
      }
      req.flash('error_msg', 'Reserva não encontrada.');
      res.redirect('/reservas');
    } catch (error) {
      console.error('Erro ao deletar reserva:', error);
      req.flash('error_msg', 'Erro ao deletar reserva.');
      res.redirect('/reservas');
    }
  },

  generateReservaSalaReport: async (req, res) => {
    try {
      const { dataInicio, dataFim, salaId, profissionalId } = req.query;
      const where = {};

      if (dataInicio && dataFim) {
        where.data = { [Op.between]: [new Date(dataInicio), new Date(dataFim)] };
      } else if (dataInicio) {
        where.data = { [Op.gte]: new Date(dataInicio) };
      } else if (dataFim) {
        where.data = { [Op.lte]: new Date(dataFim) };
      }

      if (salaId) {
        where.salaId = salaId;
      }

      if (profissionalId) {
        where.profissionalId = profissionalId;
      }

      const reservas = await ReservaSala.findAll({
        where,
        include: [
          { model: Sala, as: 'sala' },
          { model: Profissional, as: 'profissional' }
        ],
      });

      if (reservas.length === 0) {
        return res.status(404).send('Nenhuma reserva encontrada para os filtros aplicados.');
      }

      let htmlContent = '<h1>Relatório de Reservas de Sala</h1><table border="1" cellpadding="5" cellspacing="0"><thead><tr><th>Data</th><th>Horário Inicial</th><th>Horário Final</th><th>Sala</th><th>Profissional</th></tr></thead><tbody>';
      reservas.forEach(reserva => {
        const dataFormatada = new Date(reserva.data).toLocaleDateString();
        htmlContent += `<tr><td>${dataFormatada}</td><td>${reserva.horarioInicial}</td><td>${reserva.horarioFinal}</td><td>${reserva.sala ? reserva.sala.nome : 'Sala não encontrada'}</td><td>${reserva.profissional ? reserva.profissional.nome : 'Profissional não encontrado'}</td></tr>`;
      });
      htmlContent += '</tbody></table>';

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(htmlContent);

      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_reservas_sala.pdf');
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Erro ao gerar o relatório em PDF:', error);
      res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
    }
  },

  viewReservasSalaReport: async (req, res) => {
    try {
      const { dataInicio, dataFim, salaId, profissionalId } = req.query;
      const where = {};

      if (salaId) {
        where.salaId = salaId;
      }
      if (profissionalId) {
        where.profissionalId = profissionalId;
      }
    
      if (dataInicio && dataFim) {
        where.data = {
          [Op.between]: [dataInicio, dataFim],
        };
      } else if (dataInicio) {
        where.data = {
          [Op.gte]: dataInicio, 
        };
      } else if (dataFim) {
        where.data = {
          [Op.lte]: dataFim, 
        };
      }

      const reservas = await ReservaSala.findAll({
        where,
        include: [
          { model: Sala, as: 'sala' },
          { model: Profissional, as: 'profissional' }
        ]
      });

      if (reservas.length === 0) {
        res.render('relatorios/viewReservasSalaReport', { layout: false} );
      }

      const salas = await Sala.findAll();
      const profissionais = await Profissional.findAll();

      res.render('relatorios/viewReservasSalaReport', { reservas, salas, profissionais, layout: false });
    } catch (error) {
      console.error('Erro ao gerar o relatório de reservas de sala:', error);
      res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
    }
  },


  gerarRelatorioReservasSalaCSV: async (req, res) => {
    try {
      const { salaId, profissionalId } = req.query;
      const where = {};
  
      if (salaId) {
        where.salaId = salaId;
      }
      if (profissionalId) {
        where.profissionalId = profissionalId;
      }
  
      const reservas = await ReservaSala.findAll({
        where,
        include: [
          { model: Sala, as: 'sala' },
          { model: Profissional, as: 'profissional' }
        ]
      });
  
      if (reservas.length === 0) {
        res.render('relatorios/viewReservasSalaReport', { layout: false });
        return;
      }
  
      const salas = await Sala.findAll();
      const profissionais = await Profissional.findAll();
  
      const wb = new excel.Workbook();
      const ws = wb.addWorksheet('Reservas de Sala');
  
      ws.columns = [
        { header: 'Data', key: 'data', width: 15 },
        { header: 'Horário Início', key: 'horarioInicial', width: 15 },
        { header: 'Horário Fim', key: 'horarioFinal', width: 15 },
        { header: 'Sala', key: 'sala', width: 30 },
        { header: 'Profissional', key: 'profissional', width: 30 },
      ];
  
      reservas.forEach(reserva => {
        ws.addRow({
          data: reserva.data,
          horarioInicial: reserva.horarioInicial,
          horarioFinal: reserva.horarioFinal,
          sala: reserva.sala.nome,
          profissional: reserva.profissional.nome
        });
      });
  
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="Relatorio_Reservas.csv"');
  
      wb.csv.write(res)
        .then(() => {
          console.log('Arquivo CSV gerado com sucesso.');
        })
        .catch((error) => {
          console.error('Erro ao gerar o arquivo CSV:', error);
          res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
        });
  
    } catch (error) {
      console.error('Erro ao gerar o relatório de reservas de sala:', error);
      res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
    }
  }};
  
  

module.exports = reservasSalaController;
