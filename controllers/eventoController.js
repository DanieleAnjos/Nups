const { Evento, Imagem } = require('../models'); 
const { Op } = require('sequelize'); 
const upload = require('../config/multer'); 

const eventoController = {
  index: async (req, res) => {
    try {
        const { titulo, dataHoraInicio } = req.query;

        const where = {};
        
        if (titulo) {
            where.titulo = {
                [Op.like]: `%${titulo}%`, 
            };
        }
        
        if (dataHoraInicio) {
            where.dataHoraInicio = {
                [Op.gte]: new Date(dataHoraInicio), 
            };
        }

        const eventos = await Evento.findAll({
            where,
        });

        res.render('eventos/index', {
            eventos,
            search: { titulo, dataHoraInicio },
        });
    } catch (error) {
        console.error('Erro ao listar eventos:', error);
        res.status(500).send('Erro ao listar eventos.');
    }
},


  create: (req, res) => {
    res.render('eventos/create');
  },

  store: async (req, res) => {
    try {
      const { titulo, descricao, localizacao, dataHoraInicio, dataHoraFim, responsaveis, link, privacidade } = req.body;

      if (!titulo || !descricao || !dataHoraInicio || !dataHoraFim) {
        return res.render('eventos/create', { errorMessage: 'Preencha todos os campos obrigatórios.' });
      }
      const evento = await Evento.create({
        titulo,
        descricao,
        localizacao,
        dataHoraInicio,
        dataHoraFim,
        responsaveis,
        link,
        privacidade,
      });

      if (req.files && req.files.length > 0) {
        await handleImageUpload(req.files, evento.id);
      }

      res.redirect('/eventos');
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      res.render('eventos/create', { errorMessage: 'Erro ao criar evento.' });
    }
  },

  edit: async (req, res) => {
    try {
        const evento = await Evento.findByPk(req.params.id, { include: 'imagens' });
        if (!evento) {
            return res.render('eventos/edit', { errorMessage: 'Evento não encontrado.' });
        }
        res.render('eventos/edit', { evento });
    } catch (error) {
        console.error('Erro ao buscar evento:', error);
        res.render('eventos/edit', { errorMessage: 'Erro ao buscar evento.' });
    }
},


  update: async (req, res) => {
    try {
      const evento = await Evento.findByPk(req.params.id);
      if (!evento) {
        return res.render('eventos/edit', { errorMessage: 'Evento não encontrado.' });
      }

      const { titulo, descricao, localizacao, dataHoraInicio, dataHoraFim, responsaveis, link, privacidade } = req.body;

      await evento.update({
        titulo,
        descricao,
        localizacao,
        dataHoraInicio,
        dataHoraFim,
        responsaveis,
        link,
        privacidade,
      });

      if (req.files && req.files.length > 0) {
        await handleImageUpload(req.files, evento.id, true);
      }

      res.redirect('/eventos');
    } catch (error) {
      console.error('Erro ao atualizar evento:', error.message);
      res.render('eventos/edit', { errorMessage: 'Erro ao atualizar evento.' });
    }
  },

  destroy: async (req, res) => {
    try {
      const evento = await Evento.findByPk(req.params.id);
      if (!evento) {
        return res.render('eventos/index', { errorMessage: 'Evento não encontrado.' });
      }

      await Imagem.destroy({ where: { eventoId: evento.id } });
      await evento.destroy();

      res.redirect('/eventos');
    } catch (error) {
      console.error('Erro ao excluir evento:', error.message);
      res.render('eventos/index', { errorMessage: 'Erro ao excluir evento.' });
    }
  },
};

async function handleImageUpload(files, eventoId, removeOldImages = false) {
  try {
    if (removeOldImages) {
      await Imagem.destroy({ where: { eventoId } }); 
    }

    const imagensPromises = files.map(file => {
      return Imagem.create({
        eventoId,
        path: file.path,
      });
    });
    await Promise.all(imagensPromises);
  } catch (error) {
    console.error('Erro ao processar imagens:', error);
  }
}

module.exports = eventoController;
