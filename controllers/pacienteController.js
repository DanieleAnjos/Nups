const Paciente = require('../models/Paciente');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional');
const Atendimento2 = require('../models/Atendimento2');


const { Op } = require('sequelize'); 
const Encaminhamento = require('../models/Encaminhamento');
const { upload, uploadErrorHandler } = require('../config/multer');

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

exports.index2 = async (req, res) => {
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
    res.render('paciente/lista', { pacientes, query: req.query }); 
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    res.status(500).send('Erro ao listar pacientes. Por favor, tente novamente mais tarde.');
  }
};

exports.create = async (req, res) => {
  try {
    const atendimentos = await Atendimento.findAll();
    res.render('paciente/create', { atendimentos });
  } catch (error) {
    console.error('Erro ao buscar os atendimentos:', error);
    res.render('paciente/create', { errorMessage: 'Erro ao buscar os encaminhamentos.' });
  }
};
exports.store = [
  upload.single('imagem'),
  uploadErrorHandler, 
  async (req, res) => {
    try {
      if (req.file) {
        // Valida se o arquivo é uma imagem
        if (!req.file.mimetype.startsWith('image/')) {
          return res.status(400).send('Por favor, carregue apenas arquivos de imagem.');
        }
        console.log('Arquivo carregado:', req.file); 
      } else {
        console.log('Nenhum arquivo foi carregado.'); 
      }

      const { matricula, dataNascimento, sexo, cpf, rg, observacoes, ...dadosBasicos } = req.body;

      if (!matricula || !dataNascimento || !sexo || !rg || !cpf) {
        return res.status(400).send('Os campos nome, matrícula, data de nascimento, sexo e CPF são obrigatórios.');
      }


      let atendimento = await Atendimento.findOne({ where: { matricula } });

      if (!atendimento) {
        return res.status(400).send('Atendimento não encontrado para a matrícula fornecida.');
      }

      const nome = atendimento.nomePaciente; 
      const numeroProcesso = atendimento.numeroProcesso;

      const imagePath = req.file ? req.file.filename : null;

      await Paciente.create({
        nome,
        matricula, 
        dataNascimento,
        sexo,
        cpf,
        numeroProcesso,
        imagePath, 
        ...dadosBasicos,
        cadastroCompleto: false,
      });

      const encaminhamento = await Encaminhamento.findOne({ where: { atendimentoId: atendimento.id } });

      if (encaminhamento) {
        encaminhamento.statusAcolhimento = 'Realizado';
        await encaminhamento.save();
      }
      req.flash('success_msg', 'Paciente cadastrado com sucesso!');
      res.redirect(`/pacientes`);
    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error);
      req.flash('error_msg', 'Erro ao cadastrar paciente');
      res.redirect(`/pacientes`);
    }
  }
];





exports.edit = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) {
      return res.status(404).send('Paciente não encontrado.');
    }
    res.render('paciente/edit', { paciente });
  } catch (error) {
    console.error('Erro ao editar paciente:', error);
    req.flash('error_msg', 'Erro ao editar paciente');
    res.redirect('/pacientes');
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

    req.flash('success_msg', 'Paciente atualizado com sucesso!');
    res.redirect('/pacientes');
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    req.flash('error_msg', 'Erro ao atualizar paciente.');
    res.redirect('/pacientes');
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

exports.perfil = async (req, res) => {
  const { id } = req.params; 
  try {
    const paciente = await Paciente.findByPk(id);

    if (paciente) {
      const atendimentos = await Atendimento2.findAll({
        where: { matriculaPaciente: paciente.matricula }, 
        include: [{
          model: Profissional,
          as: 'profissional',
        }],
      });

      return res.render('paciente/perfil', { paciente, atendimentos });
    } else {
      return res.status(404).send('Paciente não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao buscar perfil do paciente:', error);
    return res.status(500).send('Erro ao buscar perfil do paciente.');
  }
};

