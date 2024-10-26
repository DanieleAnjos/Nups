const AjusteEstoque = require('../models/AjusteEstoque');
const Produto = require('../models/Produto');

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
  try {
    await AjusteEstoque.create(req.body);
    res.redirect('/ajustes');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao criar ajuste de estoque.'); 
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

// Deletar ajuste de estoque
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
