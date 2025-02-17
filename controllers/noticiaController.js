const Profissional = require('../models/Profissional');
const Noticias = require('../models/Noticias');
const fs = require('fs');
const path = require('path');
const { upload} = require('../config/multer');

const noticiaController = {
  // Criar um novo evento
  criarNoticia: async (req, res) => {
    upload.single('imagem')(req, res, async (err) => {
      if (err) {
        req.flash('error_msg', `Erro ao fazer upload da imagem: ${err.message}`);
        return res.redirect('/noticias/create');
      }

      try {
        const {
          titulo,
          subTitulo,
          etiqueta,
          descricao,
          autor,
        } = req.body;

        if (!titulo || !descricao || !autor) {
          req.flash('error_msg', 'Preencha todos os campos obrigatórios.');
          return res.redirect('/noticias/create');
        }

        let imagePath = null;
        if (req.file) {
          if (!req.file.mimetype.startsWith('image/')) {
            req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
            return res.redirect('/noticias/create');
          }
          imagePath = req.file.filename;
        }

        await Noticias.create({
          titulo,
          subTitulo,
          etiqueta,
          descricao,
          autor,
          imagePath,
        });

        req.flash('success_msg', 'Notícia criado com sucesso!');
        return res.redirect('/noticias');
      } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erro ao criar notícia.');
        return res.redirect('/noticias/create');
      }
    });
  },

  create: async (req, res) => {
    try {
      const profissionais = await Profissional.findAll();
      res.render('noticias/create', { profissionais });
    } catch (error) {
      console.error('Erro ao buscar os profissionais:', error);
      res.render('noticias/create', { errorMessage: 'Erro ao buscar os profissionais.' });
    }
  },

  listarNoticia: async (req, res) => {
    try {
      const { autor } = req.query; 
  
      const whereConditions = {};
  
      if (autor) {
        whereConditions.autor = { [Op.like]: `%${autor}%` }; 
      }
  
  
      const noticias = await Noticias.findAll({
        where: whereConditions
      });
  
      res.render('noticias/index', { noticias, query: req.query });
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao listar noticias.');
      res.redirect('/');
    }
  },
  

  visualizarNoticia: async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; 
        const offset = (page - 1) * limit;

        const noticias = await Noticias.findAll({
            limit: limit,
            offset: offset,
        });

        const totalNoticias = await Noticias.count();
        const totalPages = Math.ceil(totalNoticias / limit);

        if (noticias.length === 0) {
            req.flash('info_msg', 'Nenhuma notícia encontrada.');
            return res.render('Nups-Noticias', { noticias, totalPages, currentPage: page, layout: 'public/public-layout' });
        }

        res.render('Nups-Noticias', { noticias, totalPages, currentPage: page, layout: 'public/public-layout' });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erro ao carregar notícias.');
        res.redirect('/noticias');
    }
},

  edit: async (req, res) => {
    try {
      const { id } = req.params;

      const noticias = await Noticias.findByPk(id);

      if (!noticias) {
        req.flash('error_msg', 'Notícia não encontrada.');
        return res.redirect('/noticias');
      }

      const imagePath = noticias.imagePath ? `/uploads/images/${noticias.imagePath}` : null;
      console.log(imagePath);


      const profissionais = await Profissional.findAll();

      res.render('noticias/edit', { noticias, profissionais, imagePath });
    } catch (error) {
      console.error('Erro ao buscar notícia para edição:', error);
      req.flash('error_msg', 'Erro ao carregar notícia para edição.');
      res.redirect('/noticias');
    }
  },

  atualizarNoticia: async (req, res) => {
    upload.single('imagem')(req, res, async (err) => {
      if (err) {
        req.flash('error_msg', `Erro ao fazer upload da imagem: ${err.message}`);
        return res.redirect(`/noticias/${req.params.id}/edit`);
      }

      try {
        const id = req.params.id;
        const noticias = await Noticias.findByPk(id);

        if (!noticias) {
          req.flash('error_msg', 'Notícia não encontrada.');
          return res.redirect('/noticias');
        }

        const {
          titulo,
          subTitulo,
          etiqueta,
          descricao,
          autor,
        } = req.body;

        if (!titulo || !descricao || !autor) {
          req.flash('error_msg', 'Preencha todos os campos obrigatórios.');
          return res.redirect(`/noticias/${id}/edit`);
        }

        let imagePath = noticias.imagePath;
        if (req.file) {

            if (!req.file.mimetype.startsWith('image/')) {
            req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
            return res.redirect(`/noticias/${id}/edit`);
          }
          imagePath = req.file.filename; 
        }

        await noticias.update({
          titulo,
          subTitulo,
          etiqueta,
          descricao,
          autor,
          imagePath,
        });

        req.flash('success_msg', 'Notícia atualizado com sucesso!');
        res.redirect('/noticias');
      } catch (error) {
        console.error('Erro ao atualizar notícia:', error);
        req.flash('error_msg', 'Erro ao atualizar notícia.');
        res.redirect(`/noticias/${req.params.id}/edit`);
      }
    });
  },
  // Excluir um evento (somente se ainda não começou)
  deletarNoticia: async (req, res) => {
    try {
      const noticias = await Noticias.findByPk(req.params.id);

      if (!noticias) {
        req.flash('error_msg', 'Notícia não encontrada.');
        return res.redirect('/noticias');
      }

      await noticias.destroy();
      req.flash('success_msg', 'Evento excluído com sucesso.');
      res.redirect('/noticias');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao excluir evento.');
      res.redirect('/noticias');
    }
  },



  visualizar: async (req, res) => {
    try {
        const noticias = await Noticias.findByPk(req.params.id, {
        });
  
        if (!noticias) {
            req.flash('error_msg', 'Notícia não encontrado.');
            return res.redirect('/noticias');
        }

        const imagePath = noticias.imagePath ? `/uploads/images/${noticias.imagePath}` : null;

        const descricaoFormatada = noticias.descricao
        ? noticias.descricao.split("\n").map(linha => `<p>${linha}</p>`).join("")
        : "";
  
  
        res.render('Noticia-detalhes', { noticias, imagePath, descricaoFormatada, layout: 'public/public-layout' }); 
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erro ao carregar notícia.');
        res.redirect('/noticias');
    }
  },


  

};

module.exports = noticiaController;