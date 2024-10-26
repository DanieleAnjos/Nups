const Paciente = require('../models/Paciente');
const { Op } = require('sequelize'); 

exports.index = async (req, res) => {
  try {
    const { nome, matricula } = req.query; 

    const where = {}; 

    if (nome) {
      where.nome = { [Op.like]: `%${nome}%` }; 
    }

    if (matricula) {
      where.matricula = matricula; 
    }

    const pacientes = await Paciente.findAll({ where });
    res.render('paciente/index', { pacientes, query: req.query }); 
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
    const { nome, matricula, dataNascimento, sexo, cpf, encaminhamento, numeroProcesso, ...dadosBasicos } = req.body; // Desestruturar os campos

    if (!nome || !matricula || !dataNascimento || !sexo || !cpf || !encaminhamento ||!numeroProcesso) {
      return res.status(400).send('Os campos nome, matrícula, data de nascimento, sexo, CPF e encaminhamento são obrigatórios.');
    }

    const paciente = await Paciente.create({
      nome,
      matricula,
      dataNascimento,
      sexo,
      cpf,
      encaminhamento,
      numeroProcesso,
      ...dadosBasicos,
      cadastroCompleto: false, 
    });

    res.redirect(`/pacientes`);
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

    await paciente.update({
      ...req.body,
      cadastroCompleto: true, 
    });

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
