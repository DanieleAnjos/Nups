const Escala = require('../models/Escala');
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize'); 
const fs = require('fs');
const { Parser } = require('json2csv');

const puppeteer = require('puppeteer');

const escalaController = {

  index: async (req, res) => {
    try {
      const { dataInicio, dataFim, horarioInicio, horarioFim, profissional } = req.query;
  
      const where = {};
  
      // Filtro por intervalo de datas
      if (dataInicio && dataFim) {
        where.data = { [Op.between]: [dataInicio, dataFim] };
      } else if (dataInicio) {
        where.data = { [Op.gte]: dataInicio }; // Data maior ou igual a dataInicio
      } else if (dataFim) {
        where.data = { [Op.lte]: dataFim }; // Data menor ou igual a dataFim
      }
  
      // Filtro por horário
      if (horarioInicio) {
        where.horarioInicio = { [Op.gte]: horarioInicio };
      }
  
      if (horarioFim) {
        where.horarioFim = { [Op.lte]: horarioFim };
      }
  
      const profissionalLogado = await Profissional.findByPk(req.user.profissionalId, {
        attributes: ['cargo'],
      });
  
      const cargoAdministrador = 'Administrador';
      const cargoAdm = 'Adm';
  
      // Determinar o filtro de profissional com base no cargo do usuário
      let whereProfissional = {};
  
      if ([cargoAdministrador, cargoAdm].includes(profissionalLogado.cargo)) {
        // Administradores e 'Adm' podem ver todas as escalas
        whereProfissional = {};
      } else {
        // Outros profissionais só podem ver suas próprias escalas E as escalas dos administradores
        whereProfissional = {
          [Op.or]: [
            { id: req.user.profissionalId }, // Escala do próprio profissional
            { cargo: cargoAdm } // Escalas dos administradores
          ]
        };
      }
  
      if (profissional) {
        whereProfissional.id = profissional;
      }
  
      const include = [{
        model: Profissional,
        as: 'admin',
        attributes: ['id', 'nome', 'cargo'],
        where: whereProfissional,
      }];
  
      const escalas = await Escala.findAll({
        where,
        include,
      });
  
      function generateColorFromName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = (hash << 5) - hash + name.charCodeAt(i);
          hash |= 0;
        }
        return '#' + ((hash & 0x00FFFFFF) | 0x000000).toString(16).padStart(6, '0').toUpperCase();
      }
  
      const escalasFormatadas = escalas.map(escala => {
        const dataFormatada = new Date(escala.data);
        const dataLocal = dataFormatada.toISOString().split('T')[0];
  
        const horarioInicioFormatado = typeof escala.horarioInicio === 'string'
          ? escala.horarioInicio
          : new Date(escala.horarioInicio).toISOString().slice(11, 16);
  
        const horarioFimFormatado = typeof escala.horarioFim === 'string'
          ? escala.horarioFim
          : new Date(escala.horarioFim).toISOString().slice(11, 16);
  
        const cor = generateColorFromName(escala.admin.nome);
  
        return {
          ...escala.toJSON(),
          data: dataLocal,
          horarioInicio: horarioInicioFormatado,
          horarioFim: horarioFimFormatado,
          cor,
        };
      });
  
      const profissionais = await Profissional.findAll();
  
      res.render('escalas/index', {
        escalas: escalasFormatadas,
        profissionais,
        query: req.query,
        profissional: req.user,
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
      const escalas = req.body.escalas; // Um array de objetos com data, horarioInicio, horarioFim, adminId
  
      if (!Array.isArray(escalas) || escalas.length === 0) {
        req.flash('error_msg', 'Nenhuma escala fornecida.');
        return res.redirect('/escalas/create');
      }
  
      const conflitos = [];
  
      for (const escala of escalas) {
        const { data, horarioInicio, horarioFim, adminId } = escala;
  
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
          conflitos.push(`Conflito na data ${data}, horário ${horarioInicio} - ${horarioFim} para o profissional ID ${adminId}`);
        } else {
          await Escala.create({ data, horarioInicio, horarioFim, adminId });
        }
      }
  
      if (conflitos.length > 0) {
        req.flash('error_msg', conflitos.join('. '));
      } else {
        req.flash('success_msg', 'Todas as escalas foram cadastradas com sucesso!');
      }
  
      res.redirect('/escalas');
    } catch (error) {
      console.error('Erro ao criar escalas:', error);
      req.flash('error_msg', 'Erro ao criar as escalas.');
      res.redirect('/escalas/create');
    }
  },
  
  edit: async (req, res) => {
    try {
        const escala = await Escala.findByPk(req.params.id, {
            include: [{ model: Profissional, as: 'admin' }]
        });
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
        req.flash('success_msg', 'Escala atualizada com sucesso!');
        res.redirect('/escalas');
    } catch (error) {
        console.error('Erro ao atualizar a escala:', error);
        const profissionais = await Profissional.findAll();
        req.flash('error_msg', 'Erro ao atualizar escala');
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
      req.flash('success_msg','Escala excluída com sucesso!');
      res.redirect('/escalas');
    } catch (error) {
      console.error('Erro ao excluir a escala:', error);
      req.flash('error_msg','Erro ao excluir escala');
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
    },
      
      generateEscalasCSVReport: async (req, res) => {
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
      
          const escalas = await Escala.findAll({ 
            where, 
            include: [{ model: Profissional, as: 'admin' }]
          });
      
          if (escalas.length === 0) {
            return res.status(404).send('Nenhuma escala encontrada para gerar o relatório.');
          }
      
          // Criar os dados para o CSV
          const dados = escalas.map(escala => ({
            'Data': new Date(escala.data).toLocaleDateString(),
            'Horário Início': escala.horarioInicio,
            'Horário Fim': escala.horarioFim,
            'Profissional': escala.admin ? escala.admin.nome : 'N/A',
          }));
      
          const parser = new Parser();
          const csvData = parser.parse(dados);
      
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=relatorio_escalas.csv');
          res.send(csvData);
      
        } catch (error) {
          console.error('Erro ao gerar o relatório de escalas em CSV:', error);
          res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
        }
      
  }};

  


module.exports = escalaController;
