const Paciente = require('../models/Paciente');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional');
const Documento = require('../models/Documento');


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
                if (!req.file.mimetype.startsWith('image/')) {
                    return res.status(400).send('Por favor, carregue apenas arquivos de imagem.');
                }
                console.log('Arquivo carregado:', req.file);
            } else {
                console.log('Nenhum arquivo foi carregado.');
            }

            const { nome, matricula, dataNascimento, sexo, cpf, rg, telefone, telefoneContato, ...dadosBasicos } = req.body;

            if (!nome || !matricula || !dataNascimento || !sexo || !cpf || !rg) {
                return res.status(400).send('Os campos nome, matrícula, data de nascimento, sexo, CPF e RG são obrigatórios.');
            }

            // Remove formatação dos campos
            const telefoneLimpo = telefone ? telefone.replace(/\D/g, '') : null;
            const telefoneContatoLimpo = telefoneContato ? telefoneContato.replace(/\D/g, '') : null;
            const cpfLimpo = cpf.replace(/\D/g, '');
            const rgLimpo = rg.replace(/\D/g, '');

            await Paciente.create({
                nome,
                matricula,
                dataNascimento,
                sexo,
                cpf: cpfLimpo,
                rg: rgLimpo,
                telefone: telefoneLimpo,
                telefoneContato: telefoneContatoLimpo,
                imagePath: req.file ? req.file.filename : null,
                ...dadosBasicos,
                cadastroCompleto: false,
            });

            req.flash('success_msg', 'Paciente cadastrado com sucesso!');
            res.redirect('/pacientes');
        } catch (error) {
            console.error('Erro ao cadastrar paciente:', error);
            req.flash('error_msg', 'Erro ao cadastrar paciente.');
            res.redirect('/pacientes');
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
      console.log('Dados recebidos:', req.body); // Log para depuração

      const paciente = await Paciente.findByPk(req.params.id);
      if (!paciente) {
        req.flash('error_msg', 'Paciente não encontrado.');
        return res.redirect('/pacientes');
      }

      const { nome, cpf, matricula, dataNascimento, sexo, rg, telefone, telefoneContato } = req.body;

      // Verificar campos obrigatórios
      if (!nome || !cpf || !matricula || !dataNascimento || !sexo || !rg) {
        const errorMessage = 'Os campos nome, CPF, matrícula, data de nascimento, sexo e RG são obrigatórios.';
        console.error(errorMessage, { nome, cpf, matricula, dataNascimento, sexo, rg });
        req.flash('error_msg', errorMessage);
        return res.redirect(`/pacientes/edit/${req.params.id}`);
      }

      // Remove formatação dos campos
      const telefoneLimpo = telefone ? telefone.replace(/\D/g, '') : null;
      const telefoneContatoLimpo = telefoneContato ? telefoneContato.replace(/\D/g, '') : null;
      const cpfLimpo = cpf.replace(/\D/g, '');
      const rgLimpo = rg.replace(/\D/g, '');

      // Atualizar os dados do paciente
      await paciente.update({
        nome,
        cpf: cpfLimpo,
        matricula,
        dataNascimento,
        sexo,
        rg: rgLimpo,
        telefone: telefoneLimpo,
        telefoneContato: telefoneContatoLimpo,
        imagePath: req.file ? req.file.filename : paciente.imagePath, // Mantém a imagem existente se nenhuma nova for enviada
      });

      req.flash('success_msg', 'Paciente atualizado com sucesso.');
      res.redirect('/pacientes');
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      req.flash('error_msg', 'Erro ao atualizar paciente.');
      res.redirect(`/pacientes/edit/${req.params.id}`);
    }
  },
];


exports.delete = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) {
      return res.status(404).send('Paciente não encontrado.');
    }
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

