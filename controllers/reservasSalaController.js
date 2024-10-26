const ReservaSala = require('../models/ReservaSala');
const Sala = require('../models/Sala');
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize');

const reservasSalaController = {
  listarReservas: async (req, res) => {
    try {
      const { data, horarioInicial, horarioFinal, salaId, profissionalId } = req.query;

      const where = {}; 

      if (data) {
        where.data = data; 
      }

      if (horarioInicial) {
        where.horarioInicial = { [Op.gte]: horarioInicial }; 
      }

      if (horarioFinal) {
        where.horarioFinal = { [Op.lte]: horarioFinal };
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
        ]
      });

      const reservasComNomes = reservas.map(reserva => ({
        ...reserva.toJSON(),
        profissionalNome: reserva.profissional ? reserva.profissional.nome : 'N/A'
      }));

      const salas = await Sala.findAll();
      const profissionais = await Profissional.findAll();

      res.render('reservas', { 
        reservas: reservasComNomes, 
        errorMessage: req.flash('error'), 
        successMessage: req.flash('success'),
        query: req.query, 
        salas,
        profissionais
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
      req.flash('error', 'Erro ao carregar salas.');
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
        req.flash('error', 'Já existe uma reserva para esta sala neste dia e horário.');
        return res.redirect('/reservas/create');
      }

      await ReservaSala.create(req.body);
      req.flash('success', 'Reserva criada com sucesso!');
      res.redirect('/reservas');
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      req.flash('error', 'Erro ao criar reserva.');
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
        req.flash('error', 'Reserva não encontrada.');
        return res.redirect('/reservas');
      }

      res.render('reservas/edit', { reserva, salas, profissionais, errorMessage: req.flash('error') });
    } catch (error) {
      console.error('Erro ao carregar reserva:', error);
      req.flash('error', 'Erro ao carregar reserva.');
      res.redirect('/reservas');
    }
  },

  atualizarReserva: async (req, res) => {
    try {
      const { salaId, data, horarioInicial, horarioFinal } = req.body;

      const inicial = new Date(`${data}T${horarioInicial}:00Z`);
      const final = new Date(`${data}T${horarioFinal}:00Z`);
      if (inicial >= final) {
        req.flash('error', 'O horário inicial deve ser anterior ao horário final.');
        return res.redirect(`/reservas/${req.params.id}/edit`);
      }

      const conflitos = await ReservaSala.findOne({
        where: {
          salaId,
          data,
          id: { [Op.ne]: req.params.id }, 
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
        req.flash('error', 'Já existe uma reserva para esta sala neste dia e horário.');
        return res.redirect(`/reservas/${req.params.id}/edit`);
      }

      const [updated] = await ReservaSala.update(req.body, { where: { id: req.params.id } });
      if (updated) {
        req.flash('success', 'Reserva atualizada com sucesso!');
        return res.redirect('/reservas');
      }
      req.flash('error', 'Reserva não encontrada.');
      res.redirect('/reservas');
    } catch (error) {
      console.error('Erro ao atualizar reserva:', error);
      req.flash('error', 'Erro ao atualizar reserva.');
      res.redirect('/reservas');
    }
  },

  deletarReserva: async (req, res) => {
    try {
      const deleted = await ReservaSala.destroy({ where: { id: req.params.id } });
      if (deleted) {
        req.flash('success', 'Reserva deletada com sucesso!');
        return res.redirect('/reservas');
      }
      req.flash('error', 'Reserva não encontrada.');
      res.redirect('/reservas');
    } catch (error) {
      console.error('Erro ao deletar reserva:', error);
      req.flash('error', 'Erro ao deletar reserva.');
      res.redirect('/reservas');
    }
  }
};

module.exports = reservasSalaController;
