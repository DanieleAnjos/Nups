const Ocorrencia = require('../models/Ocorrencia'); 
const Profissional = require('../models/Profissional'); 

const { Op } = require('sequelize');

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
          where: profissional ? { nome: { [Op.like]: `%${profissional}%` } } : undefined // Filtra pelo nome do profissional se fornecido
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
      res.redirect('/ocorrencias'); 
    } catch (error) {
      console.error("Erro ao criar ocorrência:", error); 
      res.status(500).send("Erro ao criar ocorrência.");
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
      res.redirect('/ocorrencias');
    } catch (error) {
      console.error(error);
      res.status(500).send("Erro ao atualizar ocorrência.");
    }
  },

  destroy: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id); 

      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada."); 
      }

      await Ocorrencia.destroy({ where: { id: req.params.id } }); 
      res.redirect('/ocorrencias'); 
    } catch (error) {a
      console.error(error); a
      res.status(500).send("Erro ao excluir ocorrência.");
    }
  }
};

module.exports = ocorrenciaController;
