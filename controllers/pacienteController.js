const Paciente = require('../models/Paciente');

exports.index = async (req, res) => {
  try {
    const pacientes = await Paciente.findAll();
    res.render('paciente/index', { pacientes });
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    res.status(500).send('Erro ao listar pacientes. Por favor, tente novamente mais tarde.');
  }
};

exports.create = (req, res) => {
  res.render('paciente/create');
};

exports.store = async (req, res) => {
  try {
    const paciente = await Paciente.create(req.body);
    res.redirect('/pacientes');
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    res.status(500).send('Erro ao criar paciente. Verifique os dados e tente novamente.');
  }
};

exports.edit = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) {
      return res.status(404).send('Paciente não encontrado.');
    }
    res.render('paciente/edit', { paciente });
  } catch (error) {
    console.error('Erro ao editar paciente:', error);
    res.status(500).send('Erro ao carregar paciente para edição.');
  }
};

exports.update = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) {
      return res.status(404).send('Paciente não encontrado.');
    }
    await paciente.update(req.body);
    res.redirect('/pacientes');
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    res.status(500).send('Erro ao atualizar paciente. Verifique os dados e tente novamente.');
  }
};

exports.delete = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) {
      return res.status(404).send('Paciente não encontrado.');
    }
    await Paciente.destroy({ where: { id: req.params.id } });
    res.redirect('/pacientes');
  } catch (error) {
    console.error('Erro ao deletar paciente:', error);
    res.status(500).send('Erro ao deletar paciente. Tente novamente mais tarde.');
  }
};
