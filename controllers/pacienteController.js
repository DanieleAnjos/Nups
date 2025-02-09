const Paciente = require('../models/Paciente');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional');
const Documento = require('../models/Documento');
const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');


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
    console.error('Erro ao listar servidores:', error);
    res.status(500).send('Erro ao listar servidores. Por favor, tente novamente mais tarde.');
  }
};

exports.create = async (req, res) => {
  try {
    const atendimentos = await Atendimento.findAll();
    res.render('paciente/create', {
       atendimentos,
       error_msg: req.flash('error_msg'), // Mensagens de erro
       success_msg: req.flash('success_msg') 
       });
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
      // Verifica erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg);
        req.flash('error_msg', errorMessages.join('. '));
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      const { nome, matricula, dataNascimento, sexo, cpf, rg, telefone, telefoneContato, ...dadosBasicos } = req.body;

      // Validação de campos obrigatórios
      if (!nome || !matricula || !dataNascimento || !sexo || !cpf || !rg) {
        req.flash('error_msg', 'Os campos nome, matrícula, data de nascimento, sexo, CPF e RG são obrigatórios.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      // Verifica se o CPF, RG ou matrícula já estão cadastrados
      const pacienteExistente = await Paciente.findOne({
        where: {
          [Op.or]: [{ cpf }, { rg }, { matricula }],
        },
      });

      if (pacienteExistente) {
        req.flash('error_msg', 'Já existe um paciente com esse CPF, RG ou matrícula.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      // Remove formatação dos campos
      const telefoneLimpo = telefone ? telefone.replace(/\D/g, '') : null;
      const telefoneContatoLimpo = telefoneContato ? telefoneContato.replace(/\D/g, '') : null;
      const cpfLimpo = cpf.replace(/\D/g, '');
      const rgLimpo = rg.replace(/\D/g, '');

      // Valida CPF
      if (cpfLimpo.length !== 11) {
        req.flash('error_msg', 'O CPF deve ter 11 dígitos.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      // Valida RG
      if (rgLimpo.length < 5) {
        req.flash('error_msg', 'O RG deve ter pelo menos 5 dígitos.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      // Valida telefone
      if (telefoneLimpo && (telefoneLimpo.length < 10 || telefoneLimpo.length > 11)) {
        req.flash('error_msg', 'O telefone deve ter entre 10 e 11 dígitos.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      if (telefoneContatoLimpo && (telefoneContatoLimpo.length < 10 || telefoneContatoLimpo.length > 11)) {
        req.flash('error_msg', 'O telefone de contato deve ter entre 10 e 11 dígitos.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      // Verifica se um arquivo foi enviado e se é uma imagem
      let imagePath = null;
      if (req.file) {
        if (!req.file.mimetype.startsWith('image/')) {
          req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
          return res.render('paciente/create', {
            error_msg: req.flash('error_msg'),
            success_msg: req.flash('success_msg'),
          });
        }
        imagePath = req.file.filename;
      }

      // Criação do paciente
      await Paciente.create({
        nome,
        matricula,
        dataNascimento,
        sexo,
        cpf: cpfLimpo,
        rg: rgLimpo,
        telefone: telefoneLimpo,
        telefoneContato: telefoneContatoLimpo,
        imagePath,
        ...dadosBasicos,
        cadastroCompleto: false,
      });

      req.flash('success_msg', 'Paciente cadastrado com sucesso!');
      res.redirect('/pacientes');
    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error);

      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map((err) => err.message);
        req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        req.flash('error_msg', 'CPF, RG ou matrícula já cadastrados.');
      } else {
        req.flash('error_msg', 'Erro ao criar o paciente.');
      }

      return res.render('paciente/create', {
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg'),
      });
    }
  },
];


exports.edit = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) {
      req.flash('error_msg', 'Paciente não encontrado.');
      return res.redirect('/pacientes');
    }
    res.render('paciente/edit', { paciente });
  } catch (error) {
    console.error('Erro ao editar paciente:', error);
    req.flash('error_msg', 'Erro ao carregar formulário de edição.');
    res.redirect('/pacientes');
  }
};

exports.update = [
  upload.single('imagem'), // Middleware para processar upload de imagem
  uploadErrorHandler, // Middleware para tratar erros de upload
  async (req, res) => {
    try {
      console.log('Dados recebidos para atualização:', req.body);

      const paciente = await Paciente.findByPk(req.params.id);
      if (!paciente) {
        req.flash('error_msg', 'Paciente não encontrado.');
        return res.redirect('/pacientes');
      }

      const { nome, cpf, matricula, dataNascimento, sexo, rg, telefone, telefoneContato } = req.body;

      // Verificar campos obrigatórios
      if (!nome || !cpf || !matricula || !dataNascimento || !sexo || !rg) {
        req.flash('error_msg', 'Os campos nome, CPF, matrícula, data de nascimento, sexo e RG são obrigatórios.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      // Remove formatação dos campos
      const telefoneLimpo = telefone ? telefone.replace(/\D/g, '') : null;
      const telefoneContatoLimpo = telefoneContato ? telefoneContato.replace(/\D/g, '') : null;
      const cpfLimpo = cpf.replace(/\D/g, '');
      const rgLimpo = rg.replace(/\D/g, '');

      // Valida CPF
      if (cpfLimpo.length !== 11) {
        req.flash('error_msg', 'O CPF deve ter 11 dígitos.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      // Valida RG
      if (rgLimpo.length < 5) {
        req.flash('error_msg', 'O RG deve ter pelo menos 5 dígitos.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      // Valida telefone
      if (telefoneLimpo && (telefoneLimpo.length < 10 || telefoneLimpo.length > 11)) {
        req.flash('error_msg', 'O telefone deve ter entre 10 e 11 dígitos.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      if (telefoneContatoLimpo && (telefoneContatoLimpo.length < 10 || telefoneContatoLimpo.length > 11)) {
        req.flash('error_msg', 'O telefone de contato deve ter entre 10 e 11 dígitos.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      // Verifica se o CPF, RG ou matrícula já estão cadastrados em outro paciente
      const pacienteExistente = await Paciente.findOne({
        where: {
          [Op.or]: [{ cpf: cpfLimpo }, { rg: rgLimpo }, { matricula }],
          id: { [Op.ne]: req.params.id }, // Exclui o próprio paciente da verificação
        },
      });

      if (pacienteExistente) {
        req.flash('error_msg', 'Já existe um paciente com esse CPF, RG ou matrícula.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      // Mantém a imagem antiga caso nenhuma nova seja enviada
      let imagePath = paciente.imagePath;
      if (req.file) {
        if (!req.file.mimetype.startsWith('image/')) {
          req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
          return res.redirect(`/pacientes/${req.params.id}/edit`);
        }
        imagePath = req.file.filename;
      }

      // Atualiza os dados do paciente
      await paciente.update({
        nome,
        cpf: cpfLimpo,
        matricula,
        dataNascimento,
        sexo,
        rg: rgLimpo,
        telefone: telefoneLimpo,
        telefoneContato: telefoneContatoLimpo,
        imagePath,
      });

      req.flash('success_msg', 'Paciente atualizado com sucesso.');
      res.redirect('/pacientes');
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      req.flash('error_msg', 'Erro ao atualizar paciente.');
      res.redirect(`/pacientes/${req.params.id}/edit`);
    }
  },
];

exports.delete = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);

    if (!paciente) {
      return res.status(404).send('Paciente não encontrado.');
    }

    // Caminho do diretório de uploads
    const imagePath = paciente.imagePath ? path.join(__dirname, '../uploads/images/', paciente.imagePath) : null;
    const documentPath = paciente.documentPath ? path.join(__dirname, '../uploads/documents/', paciente.documentPath) : null;

    // Remover imagem se existir
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`Imagem deletada: ${imagePath}`);
    }

    // Remover documento se existir
    if (documentPath && fs.existsSync(documentPath)) {
      fs.unlinkSync(documentPath);
      console.log(`Documento deletado: ${documentPath}`);
    }

    // Excluir paciente do banco de dados
    await Paciente.destroy({ where: { id: req.params.id } });

    req.flash('success_msg', 'Paciente deletado com sucesso.');
    res.redirect('/pacientes');

  } catch (error) {
    req.flash('error_msg', 'Erro ao deletar paciente.');
    console.error('Erro ao deletar paciente:', error);
    res.status(500).send('Erro ao deletar paciente. Tente novamente mais tarde.');
  }
};

exports.perfil = async (req, res) => {
  const { id } = req.params;
  try {
    const paciente = await Paciente.findByPk(id, {
      include: [
        {
          model: Atendimento,
          as: 'atendimentos', // Alias definido na associação
          include: [
            {
              model: Profissional,
              as: 'profissional', // Alias definido na associação
            },
          ],
        },
        {
          model: Documento,
          as: 'documentos', // Alias definido na associação
        },
      ],
    });

    // Se paciente for null, retorna 404 antes de acessar qualquer propriedade
    if (!paciente) {
      return res.status(404).send('Paciente não encontrado.');
    }

    console.log('Caminho da imagem:', paciente.imagePath);
    console.log('URL da imagem:', `/uploads/images/${paciente.imagePath}`);

    const imagePath = paciente.imagePath ? `/uploads/images/${paciente.imagePath}` : null;

    return res.render('paciente/perfil', { 
      paciente,
      imagePath: imagePath, // Constrói a URL corretamente
    });

  } catch (error) {
    console.error('Erro ao buscar perfil do paciente:', error);
    return res.status(500).send('Erro ao buscar perfil do paciente.');
  }
};


