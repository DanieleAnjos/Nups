const Sala = require('../models/Sala');
const ReservaSala = require('../models/ReservaSala');

const { Op } = require('sequelize'); // Certifique-se de importar o Op


module.exports = {

  listarSalas: async (req, res) => {
    try {
        const { nome, capacidade } = req.query;

        let where = {};

        if (nome) {
            where.nome = { [Op.iLike]: `%${nome}%` }; 
        }

        if (capacidade) {
            where.capacidade = capacidade; 
        }

        const salas = await Sala.findAll({ where });

        res.render('salas', { salas, query: { nome, capacidade } });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao listar salas.');
    }
},

formularioCriar: (req, res) => {
    res.render('salas/create');
},


criarSala: async (req, res) => {
  try {
    const { nome, capacidade, descricao } = req.body;

    // Verifica se já existe uma sala com o mesmo nome
    const salaExistente = await Sala.findOne({ where: { nome } });

    if (salaExistente) {
      req.flash('error_msg', 'Já existe uma sala com este nome.');
      return res.redirect('back');
    }

    await Sala.create({ nome, capacidade, descricao });

    req.flash('success_msg', 'Sala cadastrada com sucesso!');
    res.redirect('/salas');
  } catch (error) {
    req.flash('error_msg', 'Erro ao cadastrar sala!');
    console.error('Erro ao cadastrar sala:', error);
    res.redirect('/salas');
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
      const { id } = req.params;
  
      // Verifica se já existe outra sala com o mesmo nome
      const salaExistente = await Sala.findOne({
        where: { nome, id: { [Op.ne]: id } } // Exclui a própria sala da verificação
      });
  
      if (salaExistente) {
        req.flash('error_msg', 'Já existe uma sala com este nome.');
        return res.redirect('back');
      }
  
      await Sala.update({ nome, capacidade, descricao }, { where: { id } });
  
      req.flash('success_msg', 'Sala atualizada com sucesso!');
      res.redirect('/salas');
    } catch (error) {
      req.flash('error_msg', 'Erro ao atualizar sala.');
      console.error('Erro ao atualizar sala:', error);
      res.status(500).send('Erro ao atualizar sala.');
    }
  },
  

  deletarSala: async (req, res) => {
    try {
        const salaId = parseInt(req.params.id, 10);

        if (isNaN(salaId)) {
            req.flash('error_msg', 'ID de sala inválido.');
            return res.redirect('/salas');
        }

        const reservasAssociadas = await ReservaSala.count({ where: { salaId } });

        if (reservasAssociadas > 0) {
            req.flash('error_msg', 'A sala possui reservas ativas. Cancele as reservas antes de deletar.');
            return res.redirect('/salas');
        }

        const sala = await Sala.findByPk(salaId);
        if (!sala) {
            req.flash('error_msg', 'Sala não encontrada.');
            return res.redirect('/salas');
        }

        await sala.destroy();
        req.flash('success_msg', 'Sala deletada com sucesso.');
        res.redirect('/salas');
    } catch (error) {
        console.error('Erro ao deletar sala:', error);
        req.flash('error_msg', 'Erro ao deletar sala. Tente novamente mais tarde.');
        res.redirect('/salas');
    }
},

};
