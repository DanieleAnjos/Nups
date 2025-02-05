const Produto = require('../models/Produto');
const AjusteEstoque = require('../models/AjusteEstoque');
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

      const produtos = await Produto.findAll({
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
    try {
      const produto = await Produto.create(req.body);
      
      if (req.body.quantidade_inicial) {
        await produtoController.ajustarEstoque(produto.id, 'entrada', req.body.quantidade_inicial); // Chama diretamente o controller
      }
  
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
    try {
      const produto = await Produto.findByPk(req.params.id);
  
      if (!produto) {
        req.flash('error', 'Produto não encontrado');
        return res.redirect('/produtos');
      }
  
      await Produto.update(req.body, { where: { id: req.params.id } });
  
      if (req.body.quantidade_inicial) {
        await produtoController.ajustarEstoque(produto.id, 'entrada', req.body.quantidade_inicial); // Chama diretamente o controller
      }
  
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

  ajustarEstoque: async (produtoId, tipo, quantidade) => {
    try {

      await AjusteEstoque.create({
        produtoId,
        tipo,
        quantidade,
        data: new Date()
      });

      const produto = await Produto.findByPk(produtoId);

      let novaQuantidade = produto.quantidade_inicial;

      if (tipo === 'entrada') {
        novaQuantidade += quantidade;
      } else if (tipo === 'saida') {
        novaQuantidade -= quantidade;
      }

      produto.quantidade_inicial = novaQuantidade;
      await produto.save();
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      throw new Error('Erro ao ajustar estoque');
    }
  },
};

module.exports = produtoController;
