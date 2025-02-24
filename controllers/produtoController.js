const Produto = require('../models/Produto');
const AjusteEstoque = require('../models/AjusteEstoque');
const { Op } = require('sequelize');
const sequelize = require('../config/database');


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

      const produtos = await Produto.findAll({
        where,
        include: [{
          model: AjusteEstoque,
          as: 'ajustesEstoque',
          required: false 
        }]
      });

      const produtosComQuantidadeAtual = produtos.map(produto => {
        let quantidadeAjustada = produto.quantidade_inicial;

        produto.ajustesEstoque.forEach(ajuste => {
          if (ajuste.tipo === 'entrada') {
            quantidadeAjustada += ajuste.quantidade || 0;
          } else if (ajuste.tipo === 'saida') {
            quantidadeAjustada -= ajuste.quantidade || 0;
          }
        });

        produto.quantidade_atual = quantidadeAjustada;
        return produto;
      });

      res.render('produtos', {
        produtos: produtosComQuantidadeAtual,
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
      res.render('produtos/create');
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      req.flash('error', 'Erro ao carregar fornecedores.');
      res.redirect('/produtos');
    }
  },

  store: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      // Cria o produto sem a quantidade_inicial
      const produto = await Produto.create(req.body, { transaction: t });
      
      // Se a quantidade_inicial for informada, ajusta o estoque, mas não adicione ela diretamente ao produto
      if (req.body.quantidade_inicial) {
        // Ajusta o estoque com a quantidade inicial, sem adicionar ao produto diretamente
        await produtoController.ajustarEstoque(produto.id, 'entrada', req.body.quantidade_inicial, t);
      }
      
      await t.commit();
      req.flash('success', 'Produto criado com sucesso!');
      res.redirect('/produtos');
    } catch (error) {
      await t.rollback();
      console.error('Erro ao criar produto:', error);
      req.flash('error', 'Erro ao criar produto.');
      res.redirect('/produtos/create');
    }
  },
  

  edit: async (req, res) => {
    try {
      const produto = await Produto.findByPk(req.params.id);

      if (produto) {
        res.render('produtos/edit', { produto });
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
    const t = await sequelize.transaction();
    try {
      const produto = await Produto.findByPk(req.params.id, { transaction: t });
  
      if (!produto) {
        await t.rollback();
        req.flash('error', 'Produto não encontrado');
        return res.redirect('/produtos');
      }
  
      await Produto.update(req.body, { where: { id: req.params.id }, transaction: t });
  
      if (req.body.quantidade_inicial) {
        await produtoController.ajustarEstoque(produto.id, 'entrada', req.body.quantidade_inicial, t);
      }
  
      await t.commit();
      req.flash('success', 'Produto atualizado com sucesso!');
      res.redirect('/produtos');
    } catch (error) {
      await t.rollback();
      console.error('Erro ao atualizar produto:', error);
      req.flash('error', 'Erro ao atualizar produto.');
      res.redirect(`/produtos/${req.params.id}/edit`);
    }
  },
  
  destroy: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      await Produto.destroy({ where: { id: req.params.id }, transaction: t });
      await t.commit();
      req.flash('success', 'Produto deletado com sucesso!');
      res.redirect('/produtos');
    } catch (error) {
      await t.rollback();
      console.error('Erro ao deletar produto:', error);
      req.flash('error', 'Erro ao deletar produto.');
      res.redirect('/produtos');
    }
  },

  ajustarEstoque: async (produtoId, tipo, quantidade, transaction) => {
    const produto = await Produto.findByPk(produtoId, { transaction });
  
    if (!produto) {
      throw new Error('Produto não encontrado');
    }
  
    // Verifica o tipo de ajuste: 'entrada' ou 'saida'
    if (tipo === 'entrada') {
      produto.quantidade_inicial += quantidade; // Adiciona a quantidade no estoque
    } else if (tipo === 'saida') {
      produto.quantidade_inicial -= quantidade; // Subtrai a quantidade no estoque
    } else {
      throw new Error('Tipo de ajuste inválido');
    }
  
    // Atualiza o produto no banco de dados
    await produto.save({ transaction });
  },  
};

module.exports = produtoController;
