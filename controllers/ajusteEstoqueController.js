const AjusteEstoque = require('../models/AjusteEstoque');
const Produto = require('../models/Produto');
const { sequelize } = require('../models');


exports.index = async (req, res) => {
  try {
    const ajustes = await AjusteEstoque.findAll({ include: 'produto' });
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
      return res.redirect('/ajustes');
    }

    const adjustedData = data ? new Date(data) : new Date(); 

    if (quantidade <= 0 || isNaN(quantidade)) {
      req.flash('error', 'A quantidade deve ser um número positivo.');
      return res.redirect('/ajustes');
    }

    const produto = await Produto.findByPk(produtoId, { transaction: t });
    if (!produto) {
      req.flash('error', 'Produto não encontrado.');
      return res.redirect('/ajustes');
    }

    let novaQuantidade = produto.quantidade_inicial;  

    if (tipo === 'saida') {
      if (produto.quantidade_inicial < quantidade) {
        req.flash('error', 'Quantidade de saída maior do que o estoque disponível.');
        return res.redirect('/ajustes');
      }

      novaQuantidade -= quantidade; 
    } 
    else if (tipo === 'entrada') {
      novaQuantidade += quantidade; 
    } 
    else {
      req.flash('error', 'Tipo de ajuste inválido.');
      return res.redirect('/ajustes');
    }

    produto.quantidade_inicial = novaQuantidade;
    await produto.save({ transaction: t });

    await AjusteEstoque.create({
      produtoId,
      tipo,
      quantidade,
      data: adjustedData 
    }, { transaction: t });

    await t.commit();

    req.flash('success', 'Ajuste realizado com sucesso!');
    res.redirect('/ajustes');  
  } catch (error) {
    await t.rollback();

    console.error('Erro ao realizar ajuste de estoque:', error);
    req.flash('error', 'Erro ao realizar ajuste de estoque.');
    res.redirect('/ajustes');
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
  try {
    const deleted = await AjusteEstoque.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.redirect('/ajustes');
    } else {
      res.status(404).send('Ajuste não encontrado para deletar.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao deletar ajuste de estoque.'); 
  }
};




