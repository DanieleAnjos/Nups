const Paciente = require('../models/Paciente');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional');
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

      const nome = atendimento.nome;
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

      res.redirect(`/pacientes`);
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      res.status(500).json({ message: 'Erro ao criar paciente. Verifique os dados e tente novamente.', error: error.message });
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

exports.perfil = async (req, res) => {
  const { id } = req.params; 
  try {
    const paciente = await Paciente.findByPk(id, {
      include: [{
        model: Atendimento,
        include: [{
          model: Profissional,  
          as: 'profissional',   
        }],
        required: false
      }]
    });
    

    if (paciente) {
      return res.render('paciente/perfil', { paciente });
    } else {
      return res.status(404).send('Paciente não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao buscar perfil do paciente:', error);
    return res.status(500).send('Erro ao buscar perfil do paciente.');
  }
};
