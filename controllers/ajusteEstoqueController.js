const AjusteEstoque = require('../models/AjusteEstoque');
const Produto = require('../models/Produto');
const sequelize = require('../config/database');

exports.index = async (req, res) => {
  try {
    const ajustes = await AjusteEstoque.findAll({ include: 'Produto' });
    res.render('ajustes/index', { ajustes });
  } catch (error) {
    console.error(error); 
    res.status(500).send('Erro ao listar ajustes de estoque.'); 
  }
};

exports.create = async (req, res) => {
  try {
    const produtos = await Produto.findAll();
    const produtoIdSelecionado = req.query.produtoId || null; 
    res.render('ajustes/create', { produtos, produtoIdSelecionado });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar produtos para o formulário de criação.');
  }
};

exports.store = async (req, res) => {
  const t = await sequelize.transaction();  

  try {
    const { produtoId, tipo, quantidade, data } = req.body;

    if (!produtoId || !tipo || !quantidade) {
      req.flash('error', 'Dados inválidos para ajuste.');
      return res.redirect('/ajustes/create'); // Corrige para a página de criação
    }

    const adjustedData = data ? new Date(data) : new Date(); 
    const quantidadeConvertida = parseInt(quantidade, 10); 

    if (quantidadeConvertida <= 0 || isNaN(quantidadeConvertida)) {
      req.flash('error', 'A quantidade deve ser um número positivo.');
      return res.redirect('/ajustes/create');
    }

    const produto = await Produto.findByPk(produtoId, { transaction: t });
    if (!produto) {
      req.flash('error', 'Produto não encontrado.');
      return res.redirect('/ajustes/create');
    }

    let novaQuantidade = produto.quantidade_inicial;

    if (tipo === 'saida') {
      if (produto.quantidade_inicial < quantidadeConvertida) {
        req.flash('error', 'Quantidade de saída maior do que o estoque disponível.');
        return res.redirect('/ajustes/create');
      }
      novaQuantidade = produto.quantidade_inicial - quantidadeConvertida;  
    } 
    else if (tipo === 'entrada') {
      novaQuantidade = produto.quantidade_inicial + quantidadeConvertida;  
    } 
    else {
      req.flash('error', 'Tipo de ajuste inválido.');
      return res.redirect('/ajustes/create');
    }

    produto.quantidade_inicial = novaQuantidade;
    await produto.save({ transaction: t });

    await AjusteEstoque.create({
      produtoId,
      tipo,
      quantidade: quantidadeConvertida,
      data: adjustedData,
    }, { transaction: t });

    await t.commit();  

    req.flash('success', 'Ajuste realizado com sucesso!');
    res.redirect('/produtos');  // Corrige o redirecionamento
  } catch (error) {
    await t.rollback(); 

    console.error('Erro ao realizar ajuste de estoque:', error);
    req.flash('error', 'Erro ao realizar ajuste de estoque.');
    res.redirect('/ajustes/create'); // Corrige para a página de criação
  }
};

exports.edit = async (req, res) => {
  try {
    const ajuste = await AjusteEstoque.findByPk(req.params.id);
    const produtos = await Produto.findAll();
    if (ajuste) {
      res.render('ajustes/edit', { ajuste, produtos });
    } else {
      res.status(404).send('Ajuste não encontrado'); 
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar ajuste para edição.'); 
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await AjusteEstoque.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      req.flash('success', 'Ajuste atualizado com sucesso!');
      res.redirect('/ajustes');
    } else {
      res.status(404).send('Ajuste não encontrado para atualizar.'); 
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar ajuste de estoque.'); 
  }
};

exports.destroy = async (req, res) => {
  const t = await sequelize.transaction();  

  try {
    const ajuste = await AjusteEstoque.findByPk(req.params.id, { transaction: t });

    if (!ajuste) {
      return res.status(404).send('Ajuste não encontrado para deletar.');
    }

    const produto = await Produto.findByPk(ajuste.produtoId, { transaction: t });

    if (!produto) {
      return res.status(404).send('Produto relacionado não encontrado.');
    }

    let novaQuantidade = produto.quantidade_inicial;

    if (ajuste.tipo === 'entrada') {
      novaQuantidade -= ajuste.quantidade;
    } else if (ajuste.tipo === 'saida') {
      novaQuantidade += ajuste.quantidade;
    }

    produto.quantidade_inicial = novaQuantidade;
    await produto.save({ transaction: t });  

    await AjusteEstoque.destroy({ where: { id: req.params.id }, transaction: t }); 

    await t.commit();  

    req.flash('success', 'Ajuste de estoque excluído com sucesso!');
    res.redirect('/ajustes');  
  } catch (error) {
    await t.rollback();  

    console.error('Erro ao excluir ajuste de estoque:', error);
    res.status(500).send('Erro ao excluir ajuste de estoque.');  
  }
};
