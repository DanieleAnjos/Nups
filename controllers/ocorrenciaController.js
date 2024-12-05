const puppeteer = require('puppeteer');
const { Op } = require('sequelize');
const Ocorrencia = require('../models/Ocorrencia');
const Profissional = require('../models/Profissional');
const fs = require('fs');


const ocorrenciaController = {
  index: async (req, res) => {
    const { data, profissional } = req.query;
    const where = {};

    if (data) {
      where.data = data;
    }

    try {
      const ocorrencias = await Ocorrencia.findAll({
        where,
        include: [{
          model: Profissional,
          as: 'profissional',
          where: profissional ? { nome: { [Op.like]: `%${profissional}%` } } : undefined
        }]
      });

      const ocorrenciasData = ocorrencias.map(ocorrencia => ocorrencia.get({ plain: true }));

      res.render('ocorrencias/index', {
        ocorrencias: ocorrenciasData,
        query: req.query
      });
    } catch (error) {
      console.error('Erro ao listar ocorrências:', error);
      req.flash('error_msg', 'Erro ao listar ocorrências.');
      res.redirect('/ocorrencias');
    }
  },



  create: async (req, res) => {
    try {
      const profissionais = await Profissional.findAll();
      res.render('ocorrencias/create', { profissionais });
    } catch (error) {
      console.error(error);
      res.status(500).send("Erro ao buscar profissionais.");
    }
  },

  store: async (req, res) => {
    try {
      const { data, relatorio, horarioChegada, horarioSaida, profissionalId } = req.body;

      if (!data || !relatorio || !horarioChegada || !profissionalId) {
        return res.status(400).send("Todos os campos são obrigatórios.");
      }

      const chegada = new Date(`${data}T${horarioChegada}`);
      const saida = horarioSaida ? new Date(`${data}T${horarioSaida}`) : null;

      if (saida && saida <= chegada) {
        return res.status(400).send("O horário de saída deve ser posterior ao horário de chegada.");
      }

      await Ocorrencia.create({ data, relatorio, horarioChegada, horarioSaida, profissionalId });
      req.flash('success_msg', 'Ocorrência criada com sucesso.');
      res.redirect('/ocorrencias');
    } catch (error) {
      console.error("Erro ao criar ocorrência:", error);
      req.flash('error_msg', 'Erro ao criar ocorrência.');
      res.redirect('/ocorrencias');
    }
  },

  edit: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id);

      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada.");
      }

      const profissionais = await Profissional.findAll();
      res.render('ocorrencias/edit', { ocorrencia, profissionais });
    } catch (error) {
      console.error(error);
      res.status(500).send("Erro ao buscar ocorrência para edição.");
    }
  },

  update: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id);

      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada.");
      }

      const { data, relatorio, horarioChegada, horarioSaida, profissionalId } = req.body;

      if (!data || !relatorio || !horarioChegada || !profissionalId) {
        return res.status(400).send("Todos os campos são obrigatórios.");
      }

      const chegada = new Date(`${data}T${horarioChegada}`);
      const saida = horarioSaida ? new Date(`${data}T${horarioSaida}`) : null;

      if (saida && saida <= chegada) {
        return res.status(400).send("O horário de saída deve ser posterior ao horário de chegada.");
      }

      await Ocorrencia.update({ data, relatorio, horarioChegada, horarioSaida, profissionalId }, {
        where: { id: req.params.id }
      });
      req.flash('success_msg', 'Ocorrência atualizada com sucesso.');
      res.redirect('/ocorrencias');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao atualizar ocorrência.');
      res.redirect('/ocorrencias');

    }
  },

  destroy: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id);

      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada.");
      }

      await Ocorrencia.destroy({ where: { id: req.params.id } });
      req.flash('success_msg', 'Ocorrência excluída com sucesso.');
      res.redirect('/ocorrencias');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao excluir ocorrência.');
      res.redirect('/ocorrencias');
    }
  },

  generateOcorrenciaReport: async (req, res) => {
    try {
      const { dataInicio, dataFim, profissional } = req.query;
      const where = {};

      if (dataInicio && dataFim) {
        where.data = { [Op.between]: [new Date(dataInicio), new Date(dataFim)] };
      } else if (dataInicio) {
        where.data = { [Op.gte]: new Date(dataInicio) };
      } else if (dataFim) {
        where.data = { [Op.lte]: new Date(dataFim) };
      }

      if (profissional) {
        where.profissionalId = profissional;
      }

      const ocorrencias = await Ocorrencia.findAll({
        where,
        include: [{ model: Profissional, as: 'profissional' }],
      });

      if (ocorrencias.length === 0) {
        return res.status(404).send('Nenhuma ocorrência encontrada para os filtros aplicados.');
      }

      let htmlContent = '<h1>Relatório de Ocorrências</h1><table border="1" cellpadding="5" cellspacing="0"><thead><tr><th>Data</th><th>Descrição</th><th>Profissional</th></tr></thead><tbody>';
      ocorrencias.forEach(ocorrencia => {
        const dataFormatada = new Date(ocorrencia.data).toLocaleDateString(); // Formata a data
        htmlContent += `<tr><td>${dataFormatada}</td><td>${ocorrencia.descricao}</td><td>${ocorrencia.profissional ? ocorrencia.profissional.nome : 'Profissional não encontrado'}</td></tr>`;
      });
      htmlContent += '</tbody></table>';

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(htmlContent);

      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_ocorrencias.pdf');
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Erro ao gerar o relatório em PDF:', error);
      res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
    }
  },


  viewOcorrenciasReport: async (req, res) => {
  try {
    const { data, profissional } = req.query;  
    const where = {};

    if (profissional) {
      where.profissionalId = profissional;
    }

    if (data) {
      where.data = data;  
    }

    const ocorrencias = await Ocorrencia.findAll({
      where,
      include: [{
        model: Profissional,
        as: 'profissional',
        required: true  
      }]
    });

    const profissionais = await Profissional.findAll();

    const mensagem = ocorrencias.length === 0 ? 'Nenhuma ocorrência encontrada.' : null;

    res.render('relatorios/viewOcorrenciasReport', {
      ocorrencias,
      profissionais,
      query: req.query, 
      mensagem,  
      layout: false
    });

  } catch (error) {
    console.error('Erro ao gerar o relatório de ocorrências:', error);
    res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
  }
}
};



module.exports = ocorrenciaController;
