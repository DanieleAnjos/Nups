const Produto = require('../models/Produto');
const Fornecedor = require('../models/Fornecedor');
const { Op } = require('sequelize');

const produtoController = {
  listarProdutos: async (req, res) => {
    try {
      const { nome, categoria } = req.query;
      const where = {};

      if (nome) {
        where.nome = { [Op.like]: `%${nome}%` };
      }

      if (categoria) {
        where.categoria = categoria;
      }

      const produtos = await Produto.findAll({ where });
      res.render('produtos', {
        produtos,
        query: req.query,
        errorMessage: req.flash('error'),
        successMessage: req.flash('success'),
      });
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      req.flash('error', 'Erro ao listar produtos.');
      res.redirect('/produtos');
    }
  },

  create: async (req, res) => {
    try {
      const fornecedores = await Fornecedor.findAll();
      res.render('produtos/create', { fornecedores });
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      req.flash('error', 'Erro ao carregar fornecedores.');
      res.redirect('/produtos');
    }
  },

  store: async (req, res) => {
    try {
      await Produto.create(req.body);
      req.flash('success', 'Produto criado com sucesso!');
      res.redirect('/produtos');
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      req.flash('error', 'Erro ao criar produto.');
      res.redirect('/produtos/create');
    }
  },

  edit: async (req, res) => {
    try {
      const produto = await Produto.findByPk(req.params.id);
      const fornecedores = await Fornecedor.findAll();

      if (produto) {
        res.render('produtos/edit', { produto, fornecedores });
      } else {
        req.flash('error', 'Produto não encontrado');
        res.redirect('/produtos');
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      req.flash('error', 'Erro ao carregar produto.');
      res.redirect('/produtos');
    }
  },

  update: async (req, res) => {
    try {
      await Produto.update(req.body, { where: { id: req.params.id } });
      req.flash('success', 'Produto atualizado com sucesso!');
      res.redirect('/produtos');
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      req.flash('error', 'Erro ao atualizar produto.');
      res.redirect(`/produtos/${req.params.id}/edit`);
    }
  },

  destroy: async (req, res) => {
    try {
      await Produto.destroy({ where: { id: req.params.id } });
      req.flash('success', 'Produto deletado com sucesso!');
      res.redirect('/produtos');
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      req.flash('error', 'Erro ao deletar produto.');
      res.redirect('/produtos');
    }
  },
};

module.exports = produtoController;
