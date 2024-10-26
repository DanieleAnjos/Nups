const Sala = require('../models/Sala');

module.exports = {

    listarSalas: async (req, res) => {
    try {
      const salas = await Sala.findAll();
      res.render('salas', { salas });
    } catch (error) {
      res.status(500).send('Erro ao listar salas.');
    }
  },

  formularioCriar: (req, res) => {
    res.render('salas/create');
  },

  criarSala: async (req, res) => {
    try {
      const { nome, capacidade, descricao } = req.body;
      await Sala.create({ nome, capacidade, descricao });
      res.redirect('/salas');
    } catch (error) {
      res.status(500).send('Erro ao criar sala.');
    }
  },

  formularioEditar: async (req, res) => {
    try {
      const sala = await Sala.findByPk(req.params.id);
      if (sala) {
        res.render('salas/edit', { sala });
      } else {
        res.status(404).send('Sala não encontrada.');
      }
    } catch (error) {
      res.status(500).send('Erro ao buscar sala.');
    }
  },

  atualizarSala: async (req, res) => {
    try {
      const { nome, capacidade, descricao } = req.body;
      await Sala.update({ nome, capacidade, descricao }, { where: { id: req.params.id } });
      res.redirect('/salas');
    } catch (error) {
      res.status(500).send('Erro ao atualizar sala.');
    }
  },

  deletarSala: async (req, res) => {
    try {
      await Sala.destroy({ where: { id: req.params.id } });
      res.redirect('/salas');
    } catch (error) {
      res.status(500).send('Erro ao deletar sala.');
    }
  },
};
