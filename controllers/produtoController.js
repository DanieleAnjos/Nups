const Produto = require('../models/Produto');
const Fornecedor = require('../models/Fornecedor');

exports.index = async (req, res) => {
  try {
    const produtos = await Produto.findAll({ include: 'fornecedor' });
    res.render('produtos/index', { produtos });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.create = async (req, res) => {
  try {
    const fornecedores = await Fornecedor.findAll();
    res.render('produtos/create', { fornecedores });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.store = async (req, res) => {
  try {
    await Produto.create(req.body); 
    res.redirect('/produtos');
  } catch (error) {
    res.status(500).send(error.message); 
  }
};

exports.edit = async (req, res) => {
  try {
        const produto = await Produto.findByPk(req.params.id);
    const fornecedores = await Fornecedor.findAll(); // Busca todos os fornecedores

    if (produto) {
      res.render('produtos/edit', { produto, fornecedores });
    } else {
      res.status(404).send('Produto não encontrado'); 
    }
  } catch (error) {
    res.status(500).send(error.message); 
  }
};

exports.update = async (req, res) => {
  try {
    await Produto.update(req.body, { where: { id: req.params.id } });
    res.redirect('/produtos'); 
  } catch (error) {
    res.status(500).send(error.message); 
  }
};

exports.destroy = async (req, res) => {
  try {
    await Produto.destroy({ where: { id: req.params.id } });
    res.redirect('/produtos'); 
  } catch (error) {
    res.status(500).send(error.message); 
  }
};
