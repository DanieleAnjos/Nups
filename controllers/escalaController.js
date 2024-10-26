const Escala = require('../models/Escala');
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize'); 

const escalaController = {
  index: async (req, res) => {
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
      
      const profissionais = await Profissional.findAll(); 
      res.render('escalas/index', { escalas, profissionais, query: req.query }); 
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
  }
};

module.exports = escalaController;
