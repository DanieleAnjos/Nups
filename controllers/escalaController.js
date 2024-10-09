const Escala = require('../models/Escala');
const Profissional = require('../models/Profissional');

const escalaController = {

  index: async (req, res) => {
    try {
      const escalas = await Escala.findAll({ include: 'admin' }); 
      res.render('escalas/index', { escalas });
    } catch (error) {
      res.status(500).send('Erro ao buscar as escalas.');
    }
  },

  create: async (req, res) => {
    try {
      const profissionais = await Profissional.findAll(); 
      res.render('escalas/create', { profissionais });
    } catch (error) {
      res.status(500).send('Erro ao buscar os profissionais.');
    }
  },

  store: async (req, res) => {
    try {
      const { data, horarioInicio, horarioFim, adminId } = req.body;
      await Escala.create({ data, horarioInicio, horarioFim, adminId });
      res.redirect('/escalas');
    } catch (error) {
      res.status(500).send('Erro ao criar a escala.');
    }
  },

  edit: async (req, res) => {
    try {
      const escala = await Escala.findByPk(req.params.id);
      const profissionais = await Profissional.findAll(); 
      if (!escala) {
        return res.status(404).send('Escala não encontrada.');
      }
      res.render('escalas/edit', { escala, profissionais });
    } catch (error) {
      res.status(500).send('Erro ao buscar a escala.');
    }
  },

  update: async (req, res) => {
    try {
      const { data, horarioInicio, horarioFim, adminId } = req.body;
      const escala = await Escala.findByPk(req.params.id);
      if (!escala) {
        return res.status(404).send('Escala não encontrada.');
      }
      await escala.update({ data, horarioInicio, horarioFim, adminId });
      res.redirect('/escalas');
    } catch (error) {
      res.status(500).send('Erro ao atualizar a escala.');
    }
  },

  destroy: async (req, res) => {
    try {
      const escala = await Escala.findByPk(req.params.id);
      if (!escala) {
        return res.status(404).send('Escala não encontrada.');
      }
      await escala.destroy();
      res.redirect('/escalas');
    } catch (error) {
      res.status(500).send('Erro ao excluir a escala.');
    }
  }
};

module.exports = escalaController;
