const Escala = require('../models/Escala');
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize'); 
const fs = require('fs');

const puppeteer = require('puppeteer');

const escalaController = {
  index: async (req, res) => {
      try {
          const { data, horarioInicio, horarioFim, profissional } = req.query;

          const where = {};

          // Filtros de data e horário
          if (data) {
              where.data = data;
          }

          if (horarioInicio) {
              where.horarioInicio = { [Op.gte]: horarioInicio };
          }

          if (horarioFim) {
              where.horarioFim = { [Op.lte]: horarioFim };
          }

          // Filtro de profissional, se fornecido
          const include = [{
              model: Profissional,
              as: 'admin',
              attributes: ['id', 'nome'], // Incluir 'id' para associar com a cor
              where: profissional ? { id: profissional } : undefined,
          }];

          // Buscar as escalas com base no filtro
          const escalas = await Escala.findAll({
              where,
              include,
          });

          // Função para gerar cor com base no nome (opcional: você pode adicionar variação aqui)
          function generateColorFromName(name) {
              let hash = 0;
              for (let i = 0; i < name.length; i++) {
                  hash = (hash << 5) - hash + name.charCodeAt(i);
                  hash |= 0; // Converter para inteiro de 32 bits
              }

              // Gerar uma cor em formato hexadecimal
              const color = '#' + ((hash & 0x00FFFFFF) | 0x000000).toString(16).padStart(6, '0').toUpperCase();
              return color;
          }
          
          // Formatar as escalas e gerar cores dinâmicas
          const escalasFormatadas = escalas.map(escala => {
              // Garantir que a data seja um objeto Date e manipulá-la como UTC

              const dataFormatada = new Date(escala.data); // A data no banco de dados deve estar em UTC

              dataFormatada.setDate(dataFormatada.getDate() + 1); // Adiciona 1 dia à data

              // Ajustar a data para o formato correto de "YYYY-MM-DD" sem mudanças para o fuso horário local
              const dataLocal = dataFormatada.toISOString().split('T')[0]; // Ex: 2024-12-20

              // Garantir que horárioInicio e horárioFim sejam do tipo string
              const horarioInicioFormatado = typeof escala.horarioInicio === 'string' 
                ? escala.horarioInicio 
                : new Date(escala.horarioInicio).toISOString().slice(11, 16);

              const horarioFimFormatado = typeof escala.horarioFim === 'string' 
                ? escala.horarioFim 
                : new Date(escala.horarioFim).toISOString().slice(11, 16);

              // Gerar a cor se não houver no banco
              const cor = generateColorFromName(escala.admin.nome);

              return {
                  ...escala.toJSON(),
                  data: dataLocal, // Formatar para YYYY-MM-DD sem alterações de fuso horário
                  horarioInicio: horarioInicioFormatado, // Formatar para HH:mm
                  horarioFim: horarioFimFormatado, // Formatar para HH:mm
                  cor, // Cor gerada dinamicamente
              };
          });

          // Buscar todos os profissionais
          const profissionais = await Profissional.findAll();

          // Enviar dados para a view, incluindo as escalas e a correspondência de cores
          res.render('escalas/index', {
            escalas: escalasFormatadas,
            profissionais,
            query: req.query,
            profissionalColors: JSON.stringify(escalasFormatadas.reduce((acc, escala) => {
                acc[escala.admin.id] = escala.cor;
                return acc;
            }, {}))
        });            
      } catch (error) {
          console.error('Erro ao listar escalas:', error);
          res.status(500).send('Erro ao listar escalas. Por favor, tente novamente mais tarde.');
      }
  },




  create: async (req, res) => {
    try {
      const profissionais = await Profissional.findAll();
      res.render('escalas/create', { profissionais });
    } catch (error) {
      console.error('Erro ao buscar os profissionais:', error);
      res.render('escalas/create', { errorMessage: 'Erro ao buscar os profissionais.' });
    }
  },

  store: async (req, res) => {
    try {
      const { data, horarioInicio, horarioFim, adminId } = req.body;

      const existingScale = await Escala.findOne({
        where: {
          data,
          [Op.or]: [
            {
              horarioInicio: { [Op.lt]: horarioFim },
              horarioFim: { [Op.gt]: horarioInicio },
            },
            {
              horarioInicio: { [Op.gte]: horarioInicio, [Op.lte]: horarioFim },
            },
            {
              horarioFim: { [Op.gte]: horarioInicio, [Op.lte]: horarioFim },
            },
          ],
          adminId, 
        },
      });

      if (existingScale) {
        const profissionais = await Profissional.findAll(); 
        return res.render('escalas/create', {
          profissionais,
          errorMessage: 'Este profissional já tem uma escala agendada neste dia e horário.'
        });
      }

      await Escala.create({ data, horarioInicio, horarioFim, adminId });
      res.redirect('/escalas');
    } catch (error) {
      console.error('Erro ao criar a escala:', error);
      const profissionais = await Profissional.findAll(); 
      res.render('escalas/create', {
        profissionais,
        errorMessage: 'Erro ao criar a escala.'
      });
    }
  },

  edit: async (req, res) => {
    try {
      const escala = await Escala.findByPk(req.params.id);
      const profissionais = await Profissional.findAll();

      if (!escala) {
        return res.render('escalas/edit', {
          errorMessage: 'Escala não encontrada.',
          profissionais
        });
      }

      res.render('escalas/edit', { escala, profissionais });
    } catch (error) {
      console.error('Erro ao buscar a escala:', error);
      const profissionais = await Profissional.findAll();
      res.render('escalas/edit', {
        errorMessage: 'Erro ao buscar a escala.',
        profissionais
      });
    }
  },

  update: async (req, res) => {
    try {
      const { data, horarioInicio, horarioFim, adminId } = req.body;
      const escala = await Escala.findByPk(req.params.id);

      if (!escala) {
        const profissionais = await Profissional.findAll();
        return res.render('escalas/edit', {
          errorMessage: 'Escala não encontrada.',
          profissionais
        });
      }

      const existingScale = await Escala.findOne({
        where: {
          id: { [Op.ne]: escala.id }, 
          data,
          [Op.or]: [
            {
              horarioInicio: { [Op.lt]: horarioFim },
              horarioFim: { [Op.gt]: horarioInicio },
            },
            {
              horarioInicio: { [Op.gte]: horarioInicio, [Op.lte]: horarioFim },
            },
            {
              horarioFim: { [Op.gte]: horarioInicio, [Op.lte]: horarioFim },
            },
          ],
          adminId, 
        },
      });

      if (existingScale) {
        const profissionais = await Profissional.findAll(); 
        return res.render('escalas/edit', {
          escala,
          profissionais,
          errorMessage: 'Este profissional já tem uma escala agendada neste dia e horário.'
        });
      }

      await escala.update({ data, horarioInicio, horarioFim, adminId });
      res.redirect('/escalas');
    } catch (error) {
      console.error('Erro ao atualizar a escala:', error);
      const profissionais = await Profissional.findAll(); 
      res.render('escalas/edit', {
        errorMessage: 'Erro ao atualizar a escala.',
        profissionais
      });
    }
  },

  destroy: async (req, res) => {
    try {
      const escala = await Escala.findByPk(req.params.id);
      if (!escala) {
        return res.render('escalas/index', { errorMessage: 'Escala não encontrada.' });
      }
      await escala.destroy();
      res.redirect('/escalas');
    } catch (error) {
      console.error('Erro ao excluir a escala:', error);
      res.render('escalas/index', { errorMessage: 'Erro ao excluir a escala.' });
    }
  },


    generateEscalaReport: async (req, res) => {
      try {
        const { data, profissional } = req.query;
        const where = {};
  
        if (data) {
          where.data = data;
        }
  
        if (profissional) {
          where.adminId = profissional;
        }
  
        const escalas = await Escala.findAll({
          where,
          include: [{ model: Profissional, as: 'admin' }],
        });
  
        if (escalas.length === 0) {
          return res.status(404).send('Nenhuma escala encontrada para os filtros aplicados.');
        }
  
        let htmlContent = '<h1>Relatório de Escalas</h1><table border="1" cellpadding="5" cellspacing="0"><thead><tr><th>Data</th><th>Horário Início</th><th>Horário Fim</th><th>Profissional</th></tr></thead><tbody>';
        escalas.forEach(escala => {
          htmlContent += `<tr><td>${escala.data}</td><td>${escala.horarioInicio}</td><td>${escala.horarioFim}</td><td>${escala.admin ? escala.admin.nome : 'Profissional não encontrado'}</td></tr>`;
        });
        htmlContent += '</tbody></table>';
  
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
        });
  
        await browser.close();
  
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio_escalas.pdf');
        res.end(pdfBuffer);
      } catch (error) {
        console.error('Erro ao gerar o relatório em PDF:', error);
        res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
      }
    },
  
    viewEscalasReport: async (req, res) => {
      try {
          const { data, horarioInicio, horarioFim, profissional } = req.query;
  
          const where = {};
  
          if (data) {
              where.data = data; 
          }
  
          if (horarioInicio) {
              where.horarioInicio = { [Op.gte]: horarioInicio }; 
          }
  
          if (horarioFim) {
              where.horarioFim = { [Op.lte]: horarioFim }; 
          }
  
          if (profissional) {
              where.adminId = profissional; 
          }

          if (!data) {
            delete where.data;
          }
  
          const escalas = await Escala.findAll({ 
              where, 
              include: [{ model: Profissional, as: 'admin' }] 
          });
  
          const profissionais = await Profissional.findAll();
  
          res.render('relatorios/viewEscalasReport', { escalas, profissionais, query: req.query, layout: false });
      } catch (error) {
          console.error('Erro ao gerar o relatório de escalas:', error);
          res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
      }
  }};

  


module.exports = escalaController;
