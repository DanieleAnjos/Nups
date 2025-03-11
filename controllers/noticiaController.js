const Profissional = require('../models/Profissional');
const Noticias = require('../models/Noticias');
const fs = require('fs');
const path = require('path');
const { upload} = require('../config/multer');
const { Op } = require('sequelize');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


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
  
        // Verifica se todos os campos obrigatórios foram preenchidos
        if (!titulo || !descricao || !autor) {
          req.flash('error_msg', 'Preencha todos os campos obrigatórios.');
          return res.redirect('/noticias/create');
        }
  
        // Validação da imagem enviada
        let imagePath = null;
        if (req.file) {
          if (!req.file.mimetype.startsWith('image/')) {
            req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
            return res.redirect('/noticias/create');
          }
          imagePath = req.file.filename;
        }
  
        // Purifica o conteúdo da descrição para evitar XSS
        const descricaoPurificada = DOMPurify.sanitize(descricao);
  
        // Criação da notícia
        await Noticias.create({
          titulo,
          subTitulo,
          etiqueta,
          descricao: descricaoPurificada, // Usa o conteúdo purificado
          autor,
          imagePath,
        });
  
        req.flash('success_msg', 'Notícia criada com sucesso!');
        return res.redirect('/noticias');
      } catch (error) {
        console.error('Erro ao criar notícia:', error);
  
        if (error.name === 'SequelizeValidationError') {
          const validationErrors = error.errors.map((err) => err.message);
          req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
        } else if (error.name === 'SequelizeUniqueConstraintError') {
          req.flash('error_msg', 'Já existe uma notícia com este título.');
        } else {
          req.flash('error_msg', 'Erro ao criar a notícia. Tente novamente mais tarde.');
        }
  
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
      const { autor, dataInicio, dataFim } = req.query;
  
      const whereConditions = {};
  
      // Filtro por autor
      if (autor) {
        whereConditions.autor = { [Op.like]: `%${autor}%` };
      }
  
      // Filtro por data de criação
      if (dataInicio && dataFim) {
        whereConditions.createdAt = {
          [Op.between]: [new Date(dataInicio), new Date(dataFim)],
        };
      } else if (dataInicio) {
        whereConditions.createdAt = {
          [Op.gte]: new Date(dataInicio),
        };
      } else if (dataFim) {
        whereConditions.createdAt = {
          [Op.lte]: new Date(dataFim),
        };
      }
  
      // Buscando as notícias com os filtros aplicados
      const noticias = await Noticias.findAll({
        where: whereConditions,
        order: [['createdAt', 'DESC']], // Ordena por createdAt (data de criação), mais recente primeiro
      });
  
      // Renderiza a página com as notícias filtradas e os parâmetros de busca
      res.render('noticias/index', { noticias, query: req.query });
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao listar notícias.');
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
          return res.redirect(`/noticias/edit/${req.params.id}`);
        }
    
        try {
          const { id } = req.params;
          const {
            titulo,
            subTitulo,
            etiqueta,
            descricao,
            autor,
          } = req.body;
    
          // Verifica se todos os campos obrigatórios foram preenchidos
          if (!titulo || !descricao || !autor) {
            req.flash('error_msg', 'Preencha todos os campos obrigatórios.');
            return res.redirect(`/noticias/edit/${id}`);
          }
    
          // Validação da imagem enviada
          let imagePath = null;
          if (req.file) {
            if (!req.file.mimetype.startsWith('image/')) {
              req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
              return res.redirect(`/noticias/edit/${id}`);
            }
            imagePath = req.file.filename;
          }
    
          // Purifica o conteúdo da descrição para evitar XSS
          const descricaoPurificada = DOMPurify.sanitize(descricao, {
            ALLOWED_ATTR: ['href', 'target', 'rel'], // Permite os atributos href, target e rel
            FORBID_ATTR: [] // Não proíbe nenhum atributo
          });

          // Atualiza a notícia
          const noticia = await Noticias.findByPk(id);
          if (!noticia) {
            req.flash('error_msg', 'Notícia não encontrada.');
            return res.redirect('/noticias');
          }
    
          noticia.titulo = titulo;
          noticia.subTitulo = subTitulo;
          noticia.etiqueta = etiqueta;
          noticia.descricao = descricaoPurificada; // Usa o conteúdo purificado
          noticia.autor = autor;
          if (imagePath) {
            noticia.imagePath = imagePath;
          }
    
          await noticia.save();
    
          req.flash('success_msg', 'Notícia atualizada com sucesso!');
          return res.redirect('/noticias');
        } catch (error) {
          console.error('Erro ao atualizar notícia:', error);
    
          if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map((err) => err.message);
            req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
          } else if (error.name === 'SequelizeUniqueConstraintError') {
            req.flash('error_msg', 'Já existe uma notícia com este título.');
          } else {
            req.flash('error_msg', 'Erro ao atualizar a notícia. Tente novamente mais tarde.');
          }
    
          return res.redirect(`/noticias/edit/${req.params.id}`);
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