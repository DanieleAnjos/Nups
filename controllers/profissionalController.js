const Profissional = require('../models/Profissional');
const { ValidationError } = require('sequelize');

exports.index = async (req, res) => {
  try {
    const profissionais = await Profissional.findAll();
    const profissionaisData = profissionais.map(prof => prof.get({ plain: true })); // Obter dados simples
    res.render('profissional/index', { profissionais: profissionaisData });
  } catch (error) {
    console.error('Erro ao listar profissionais:', error);
    req.flash('error_msg', 'Erro ao listar profissionais.');
    res.redirect('/');
  }
};

exports.create = (req, res) => {
  res.render('profissional/create');
};

exports.store = async (req, res) => {
  try {
    const profissional = await Profissional.create(req.body);
    req.flash('success_msg', 'Profissional criado com sucesso!');
    res.redirect('/profissionais');
  } catch (error) {
    console.error('Erro ao criar profissional:', error);
    if (error instanceof ValidationError) {
      const validationErrors = error.errors.map(err => err.message);
      req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
    } else {
      req.flash('error_msg', 'Erro ao criar o profissional.');
    }
    res.redirect('/profissionais/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado.');
      return res.redirect('/profissionais');
    }
    res.render('profissional/edit', { profissional });
  } catch (error) {
    console.error('Erro ao buscar profissional:', error);
    req.flash('error_msg', 'Erro ao buscar o profissional.');
    res.redirect('/profissionais');
  }
};

exports.update = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado.');
      return res.redirect('/profissionais');
    }

    await profissional.update(req.body);
    req.flash('success_msg', 'Profissional atualizado com sucesso!');
    res.redirect('/profissionais');
  } catch (error) {
    console.error('Erro ao atualizar profissional:', error);
    if (error instanceof ValidationError) {
      const validationErrors = error.errors.map(err => err.message);
      req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
    } else {
      req.flash('error_msg', 'Erro ao atualizar o profissional.');
    }
    res.redirect(`/profissionais/edit/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado.');
    } else {
      await profissional.destroy();
      req.flash('success_msg', 'Profissional deletado com sucesso!');
    }
    res.redirect('/profissionais');
  } catch (error) {
    console.error('Erro ao deletar profissional:', error);
    req.flash('error_msg', 'Erro ao deletar o profissional.');
    res.redirect('/profissionais');
  }
};
