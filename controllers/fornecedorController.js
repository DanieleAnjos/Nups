const Fornecedor = require('../models/Fornecedor');

exports.index = async (req, res) => {
  try {
    const fornecedores = await Fornecedor.findAll();
    res.render('fornecedores/index', { fornecedores });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.create = (req, res) => {
  res.render('fornecedores/create');
};

exports.store = async (req, res) => {
  try {
    await Fornecedor.create(req.body);
    res.redirect('/fornecedores');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.edit = async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findByPk(req.params.id);
    if (fornecedor) {
      res.render('fornecedores/edit', { fornecedor });
    } else {
      res.status(404).send('Fornecedor não encontrado');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.update = async (req, res) => {
  try {
    await Fornecedor.update(req.body, { where: { id: req.params.id } });
    res.redirect('/fornecedores');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.destroy = async (req, res) => {
  try {
    await Fornecedor.destroy({ where: { id: req.params.id } });
    res.redirect('/fornecedores');
  } catch (error) {
    res.status(500).send(error.message);
  }
};
