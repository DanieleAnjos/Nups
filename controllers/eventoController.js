const Evento = require('../models/Evento');
const Profissional = require('../models/Profissional');
const fs = require('fs');
const path = require('path');
const { upload} = require('../config/multer');
const { Op } = require('sequelize');


const eventoController = {

  criarEvento: async (req, res) => {
    upload.single('imagem')(req, res, async (err) => {
      if (err) {
        req.flash('error_msg', `Erro ao fazer upload da imagem: ${err.message}`);
        return res.redirect('/eventos/create');
      }

      try {
        const {
          titulo,
          subTitulo,
          etiqueta,
          descricao,
          localizacao,
          dataHoraInicio,
          dataHoraFim,
          autor,
          link,
          privacidade,
          status,
          destaque,
          capacidadeMaxima,
        } = req.body;

        if (!titulo || !descricao || !localizacao || !dataHoraInicio || !dataHoraFim) {
          req.flash('error_msg', 'Preencha todos os campos obrigatórios.');
          return res.redirect('/eventos/create');
        }

        let imagePath = null;
        if (req.file) {

          if (!req.file.mimetype.startsWith('image/')) {
            req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
            return res.redirect('/eventos/create');
          }
          imagePath = req.file.filename;
        }

        await Evento.create({
          titulo,
          subTitulo,
          etiqueta,
          descricao,
          localizacao,
          dataHoraInicio: new Date(dataHoraInicio), 
          dataHoraFim: new Date(dataHoraFim), 
          autor,
          link,
          privacidade,
          status,
          destaque: destaque === 'on', 
          capacidadeMaxima: capacidadeMaxima ? parseInt(capacidadeMaxima, 10) : null,
          imagePath,
        });

        req.flash('success_msg', 'Evento criado com sucesso!');
        return res.redirect('/eventos');
      } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erro ao criar evento.');
        return res.redirect('/eventos/create');
      }
    });
  },

  create: async (req, res) => {
    try {
      const profissionais = await Profissional.findAll();
      res.render('eventos/create', { profissionais });
    } catch (error) {
      console.error('Erro ao buscar os profissionais:', error);
      res.render('eventos/create', { errorMessage: 'Erro ao buscar os profissionais.' });
    }
  },

  listarEventos: async (req, res) => {
    try {
      const { autor, dataInicio, dataFim } = req.query; 
  
      const whereConditions = {};
  
      if (autor) {
        whereConditions.autor = { [Op.like]: `%${autor}%` };
      }
  
      if (dataInicio && dataFim) {
        whereConditions.createdAt = {
          [Op.between]: [new Date(dataInicio), new Date(dataFim)] 
        };
      } else if (dataInicio) {
        whereConditions.createdAt = { [Op.gte]: new Date(dataInicio) }; 
      } else if (dataFim) {
        whereConditions.createdAt = { [Op.lte]: new Date(dataFim) };
      }
  
      const eventos = await Evento.findAll({
        where: whereConditions
      });
  
      res.render('eventos/index', { eventos, query: req.query });
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao listar eventos.');
      res.redirect('/');
    }
  },
  
  

  visualizarEvento: async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; 
        const offset = (page - 1) * limit;

        const eventos = await Evento.findAll({
            limit: limit,
            offset: offset,
            order: [['dataHoraInicio', 'ASC']]
        });

        const totalEventos = await Evento.count();
        const totalPages = Math.ceil(totalEventos / limit);

        if (eventos.length === 0) {
            req.flash('info_msg', 'Nenhum evento encontrado.');
            return res.render('Nups-Eventos', { eventos, totalPages, currentPage: page, layout: 'public/public-layout' });
        }

        res.render('Nups-Eventos', { eventos, totalPages, currentPage: page, layout: 'public/public-layout' });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erro ao carregar eventos.');
        res.redirect('/eventos');
    }
},

  edit: async (req, res) => {
    try {
      const { id } = req.params;

      const evento = await Evento.findByPk(id);

      if (!evento) {
        req.flash('error_msg', 'Evento não encontrado.');
        return res.redirect('/eventos');
      }

      const imagePath = evento.imagePath ? `/uploads/images/${evento.imagePath}` : null;
      console.log(imagePath);


      const profissionais = await Profissional.findAll();

      res.render('eventos/edit', { evento, profissionais, imagePath });
    } catch (error) {
      console.error('Erro ao buscar o evento para edição:', error);
      req.flash('error_msg', 'Erro ao carregar evento para edição.');
      res.redirect('/eventos');
    }
  },

  atualizarEvento: async (req, res) => {
    upload.single('imagem')(req, res, async (err) => {
      if (err) {
        req.flash('error_msg', `Erro ao fazer upload da imagem: ${err.message}`);
        return res.redirect(`/eventos/${req.params.id}/edit`);
      }

      try {
        const id = req.params.id;
        const evento = await Evento.findByPk(id);

        if (!evento) {
          req.flash('error_msg', 'Evento não encontrado.');
          return res.redirect('/eventos');
        }

        const {
          titulo,
          subTitulo,
          etiqueta,
          descricao,
          localizacao,
          dataHoraInicio,
          dataHoraFim,
          autor,
          link,
          privacidade,
          status,
          destaque,
          capacidadeMaxima,
        } = req.body;

        if (!titulo || !descricao || !localizacao || !dataHoraInicio || !dataHoraFim) {
          req.flash('error_msg', 'Preencha todos os campos obrigatórios.');
          return res.redirect(`/eventos/${id}/edit`);
        }

        let imagePath = evento.imagePath;
        if (req.file) {

          if (!req.file.mimetype.startsWith('image/')) {
            req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
            return res.redirect(`/eventos/${id}/edit`);
          }
          imagePath = req.file.filename; 
        }

        const capacidadeMaximaInt = capacidadeMaxima ? parseInt(capacidadeMaxima, 10) : null;

        if (capacidadeMaxima && isNaN(capacidadeMaximaInt)) {
          req.flash('error_msg', 'Capacidade máxima deve ser um número.');
          return res.redirect(`/eventos/${id}/edit`);
        }

        await evento.update({
          titulo,
          subTitulo,
          etiqueta,
          descricao,
          localizacao,
          dataHoraInicio: new Date(dataHoraInicio), 
          dataHoraFim: new Date(dataHoraFim), 
          autor,
          link,
          privacidade,
          status,
          destaque: destaque === 'on', 
          capacidadeMaxima: capacidadeMaximaInt,
          imagePath,
        });

        req.flash('success_msg', 'Evento atualizado com sucesso!');
        res.redirect('/eventos');
      } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        req.flash('error_msg', 'Erro ao atualizar evento.');
        res.redirect(`/eventos/${req.params.id}/edit`);
      }
    });
  },

  deletarEvento: async (req, res) => {
    try {
      const evento = await Evento.findByPk(req.params.id);

      if (!evento) {
        req.flash('error_msg', 'Evento não encontrado.');
        return res.redirect('/eventos');
      }

      const agora = new Date();
      if (new Date(evento.dataHoraInicio) < agora) {
        req.flash('error_msg', 'Não é possível excluir um evento que já começou.');
        return res.redirect('/eventos');
      }

      await evento.destroy();
      req.flash('success_msg', 'Evento excluído com sucesso.');
      res.redirect('/eventos');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao excluir evento.');
      res.redirect('/eventos');
    }
  },



  visualizar: async (req, res) => {
    try {
        const evento = await Evento.findByPk(req.params.id, {
        });
  
        if (!evento) {
            req.flash('error_msg', 'Evento não encontrado.');
            return res.redirect('/eventos');
        }

        const imagePath = evento.imagePath ? `/uploads/images/${evento.imagePath}` : null;

        const descricaoFormatada = evento.descricao
        ? evento.descricao.split("\n").map(linha => `<p>${linha}</p>`).join("")
        : "";
  
  
        res.render('Evento-detalhes', { evento, imagePath, descricaoFormatada, layout: 'public/public-layout' }); // Removido a barra inicial
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erro ao carregar evento.');
        res.redirect('/eventos');
    }
  },


  

};

module.exports = eventoController;