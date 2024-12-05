const Paciente = require('../models/Paciente');
const Profissional = require('../models/Profissional');
const Encaminhamento = require('../models/Encaminhamento');
const Notificacao = require('../models/Notificacao');
const Atendimento = require('../models/Atendimento');
const { Op } = require('sequelize'); 
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../models');

exports.index = async (req, res) => {
  try {
    const searchTerm = req.query.search || ''; 
    
    const atendimentos = await Atendimento.findAll({
      where: {
        [Op.or]: [
          { nomePaciente: { [Op.like]: `%${searchTerm}%` } },
          { '$Profissional.nome$': { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      include: [{
        model: Profissional,
        as: 'Profissional',
        attributes: ['id', 'nome']
      }],
      order: [['createdAt', 'DESC']] 
    });

    return res.status(200).render('atendimentos/index', { atendimentos, searchTerm });
  } catch (error) {
    console.error('Erro ao buscar atendimentos:', error);
    return res.status(500).json({ message: 'Erro ao buscar atendimentos.' });
  }
};

exports.create = async (req, res) => {
  try {
    const encaminhamentoSelecionado = req.query.encaminhamento;
    const cargoMap = {
      'Psicologia': 'Psicólogo',
      'Serviço Social': 'Assistente Social',
      'Psiquiatria': 'Psiquiatra'
    };

    const cargoFiltrado = cargoMap[encaminhamentoSelecionado] || null;

    const profissionais = await Profissional.findAll({
      where: cargoFiltrado ? { cargo: cargoFiltrado } : {}
    });
    req.flash('success_msg', 'Atendimento criado com sucesso!');
    return res.render('atendimentos/create', { profissionais });
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    req.flash('error_msg', 'Erro ao buscar profissionais');
    res.redirect('/atendimentos');
  }
};

exports.store = [
  body('matricula').isInt({ min: 1 }).withMessage('A matrícula deve ser um número positivo'),
  body('numeroProcesso').matches(/^[A-Za-z0-9]+$/).withMessage('O número do processo deve conter apenas letras e números'),
  body('telefone').optional().matches(/^[0-9]{10,11}$/).withMessage('O telefone deve ter 10 ou 11 dígitos'),
  body('nomePaciente').notEmpty().withMessage('O nome do paciente é obrigatório'),
  body('registroAtendimento').notEmpty().withMessage('O registro de atendimento é obrigatório'),
  body('encaminhamento').notEmpty().withMessage('O encaminhamento é obrigatório'),
  body('profissionalId').notEmpty().withMessage('O profissional é obrigatório'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(error => error.msg).join(', '));
      return res.redirect('/atendimentos/create');
    }

    try {
      const atendimentoExistente = await Atendimento.findOne({
        where: {
          [Op.or]: [
            { matricula : req.body.matricula },
            { numeroProcesso: req.body.numeroProcesso }
          ]
        }
      });

      if (atendimentoExistente) {
        req.flash('error', 'A matrícula ou o número do processo já estão registrados.');
        return res.redirect('/atendimentos/create');
      }

      const atendimento = await Atendimento.create(req.body);
      const profissional = await Profissional.findByPk(req.body.profissionalId);  

      if (profissional) {
        await Notificacao.create({
          titulo: `Novo Atendimento: ${req.body.registroAtendimento}`,
          mensagem: `Você recebeu um novo encaminhamento referente ao paciente ${req.body.nomePaciente}, matricula: ${req.body.matricula}.`,
          profissionalId: profissional.id,  
        });
      }

      req.flash('success_msg', 'Encaminhamento realizado com sucesso!');
      return res.redirect('/atendimentos');
    } catch (error) {
      console.error('Erro ao criar atendimento:', error);
      req.flash('error_msg', 'Erro ao realizar encaminhamento. Tente novamente.');
      return res.redirect('/atendimentos/create');
    }
  }
];

exports.edit = async (req, res) => {
  try {
    const atendimento = await Atendimento.findByPk(req.params.id);
    if (!atendimento) {
      return res.status(404).json({ message: 'Atendimento não encontrado.' });
    }
    return res.status(200).render('atendimentos/edit', { atendimento });
  } catch (error) {
    console.error('Erro ao buscar atendimento para edição:', error);
    return res.status(500).json({ message: 'Erro ao buscar atendimento.' });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await Atendimento.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) {
      return res.status(404).json({ message: 'Atendimento não encontrado.' });
    }
    req.flash('success_msg', 'Atendimento atualizado com sucesso!');
    return res.redirect('/atendimentos'); 
  } catch (error) {
    req.flash('error_msg','Erro ao autualizar atendimento!')
    console.error('Erro ao atualizar atendimento:', error);
    return res.redirect('/atendimentos'); 
  }
};

exports.destroy = async (req, res) => {
  try {
    const deleted = await Atendimento.destroy({
      where: { id: req.params.id }
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Atendimento não encontrado.' });
    }
    req.flash('success_msg', 'Atendimento deletado com sucesso!');
    return res.redirect('/atendimentos'); 
  } catch (error) {
    console.error('Erro ao deletar atendimento:', error);
    req.flash('error_msg', 'Erro ao deletar atendimento.');
    return res.redirect('/atendimentos'); 
  }
};

exports.dash = async (req, res) => {
  try {
    const searchTerm = req.query.search || ''; 
    
    const atendimentos = await Atendimento.findAll({
      where: {
        [Op.or]: [
          { nomePaciente: { [Op.like]: `%${searchTerm}%` } },
          { '$profissional.nome$': { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      include: [{
        model: Profissional,
        as: 'profissional',
        attributes: ['id', 'nome']
      }]
    });

    const atendimentosPorProfissional = await Atendimento.findAll({
      attributes: [
        'profissionalId',
        [sequelize.fn('COUNT', sequelize.col('Atendimento.id')), 'totalAtendimentos']
      ],
      group: ['profissionalId'],
      include: [{
        model: Profissional,
        as: 'profissional',
        attributes: ['id', 'nome']
      }]
    });

    const atendimentosPorMes = await Atendimento.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('dataAtendimento')), 'mes'],
        [sequelize.fn('COUNT', sequelize.col('Atendimento.id')), 'totalAtendimentos']
      ],
      group: [sequelize.fn('MONTH', sequelize.col('dataAtendimento'))]
    });

    return res.render('dashboard', { 
      atendimentos, 
      atendimentosPorProfissional, 
      atendimentosPorMes,
      searchTerm
    });
  } catch (error) {
    console.error('Erro ao buscar atendimentos:', error);
    return res.status(500).json({ message: 'Erro ao buscar atendimentos.' });
  }
}; 