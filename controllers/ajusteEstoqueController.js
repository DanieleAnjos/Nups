const Produto = require('../models/Produto');
const AjusteEstoque = require('../models/AjusteEstoque');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const produtoController = require('./produtoController');  // Adicione essa linha se estiver usando o produtoController



const ajusteEstoqueController = {
  store: async (req, res) => {
    const t = await sequelize.transaction();
  
    try {
      const { produtoId, tipo, quantidade, data } = req.body;
      const quantidadeConvertida = parseInt(quantidade, 10);
  
      if (!produtoId || !tipo || isNaN(quantidadeConvertida) || quantidadeConvertida <= 0) {
        req.flash('error', 'Dados inválidos para ajuste.');
        await t.rollback();
        return res.redirect('/ajustes/create');
      }
  
      const produto = await Produto.findByPk(produtoId, { transaction: t });
      if (!produto) {
        req.flash('error', 'Produto não encontrado.');
        await t.rollback();
        return res.redirect('/ajustes/create');
      }
  
      // Chama a função de ajuste de estoque corretamente
      await produtoController.ajustarEstoque(produtoId, tipo, quantidadeConvertida, t);
      await t.commit();
  
      req.flash('success', 'Ajuste realizado com sucesso!');
      res.redirect('/produtos');
    } catch (error) {
      await t.rollback();
      console.error('Erro ao realizar ajuste de estoque:', error);
      req.flash('error', 'Erro ao realizar ajuste de estoque.');
      res.redirect('/ajustes/create');
    }
  },
  

  create : async function (req, res) {
    try {
      const produtos = await Produto.findAll();
      res.render('ajustes/create', { produtos });
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      req.flash('error', 'Erro ao carregar produtos.');
      res.redirect('/ajustes/create');
    }
  },

  destroy: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const ajuste = await AjusteEstoque.findByPk(req.params.id, { transaction: t });
      if (!ajuste) {
        await t.rollback();
        return res.status(404).send('Ajuste não encontrado para deletar.');
      }

      const produto = await Produto.findByPk(ajuste.produtoId, { transaction: t });
      if (!produto) {
        await t.rollback();
        return res.status(404).send('Produto relacionado não encontrado.');
      }

      const quantidadeAjustada = ajuste.tipo === 'entrada' ? -ajuste.quantidade : ajuste.quantidade;
      await produtoController.ajustarEstoque(ajuste.produtoId, ajuste.tipo === 'entrada' ? 'saida' : 'entrada', ajuste.quantidade, t);

      await AjusteEstoque.destroy({ where: { id: req.params.id }, transaction: t });
      await t.commit();

      req.flash('success', 'Ajuste de estoque excluído com sucesso!');
      res.redirect('/ajustes');
    } catch (error) {
      await t.rollback();
      console.error('Erro ao excluir ajuste de estoque:', error);
      res.status(500).send('Erro ao excluir ajuste de estoque.');
    }
  },

  index: async (req, res) => {
    try {
      const ajustes = await AjusteEstoque.findAll({
        include: [{
          model: Produto,
          as: 'produto', // Especificando o alias corretamente
        }],
        order: [['createdAt', 'DESC']],
      });
      res.render('ajustes/index', { ajustes });
    } catch (error) {
      console.error('Erro ao carregar a lista de ajustes:', error);
      res.status(500).send('Erro ao carregar a lista de ajustes.');
    }
  }};
  

module.exports = ajusteEstoqueController;
