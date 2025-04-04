const Paciente = require('../models/Paciente');
const Profissional = require('../models/Profissional');
const Encaminhamento = require('../models/Encaminhamento');
const Notificacao = require('../models/Notificacao');
const Atendimento = require('../models/Atendimento');
const DiscussaoCaso = require('../models/DiscussaoCaso'); 
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../models');

exports.index = async (req, res) => {
  try {
    const { search, dataInicio, dataFim } = req.query;
    const profissionalId = req.user.profissionalId;

    const profissionalAssociado = await Profissional.findByPk(profissionalId, {
      attributes: ['id', 'nome', 'cargo']
    });

    if (!profissionalAssociado) {
      return res.status(403).send('Usuário não está associado a um profissional válido.');
    }

    const userCargo = profissionalAssociado.cargo.toLowerCase();
    const whereConditions = {};

    // Filtrar por intervalo de datas
    if (dataInicio && dataFim) {
      whereConditions.createdAt = { [Op.between]: [new Date(dataInicio), new Date(dataFim)] };
    } else if (dataInicio) {
      whereConditions.createdAt = { [Op.gte]: new Date(dataInicio) };
    } else if (dataFim) {
      whereConditions.createdAt = { [Op.lte]: new Date(dataFim) };
    }

    // Se for administrador, não há restrições de cargo
    if (userCargo !== 'administrador') {
      const cargosPermitidos = [userCargo];
      if (userCargo.includes('gestor')) {
        if (userCargo.includes('servico social')) {
          cargosPermitidos.push('assistente social');
        } else if (userCargo.includes('psicologia')) {
          cargosPermitidos.push('psicólogo');
        } else if (userCargo.includes('psiquiatria')) {
          cargosPermitidos.push('psiquiatra');
        }
      } else {
        if (userCargo === 'assistente social') cargosPermitidos.push('gestor servico social');
        if (userCargo === 'psicólogo') cargosPermitidos.push('gestor psicologia');
        if (userCargo === 'psiquiatra') cargosPermitidos.push('gestor psiquiatria');
      }

      whereConditions[Op.or] = [
        { '$profissional.cargo$': { [Op.in]: cargosPermitidos } }
      ];
    }

    if (search) {
      whereConditions['$paciente.nome$'] = { [Op.like]: `%${search}%` };
    }

    // Buscar os atendimentos
    const atendimentos = await Atendimento.findAll({
      where: whereConditions,
      include: [
        { model: Profissional, as: 'profissional', attributes: ['id', 'nome', 'cargo'] },
        { model: Paciente, as: 'paciente', attributes: ['id', 'nome'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Permissões
    const atendimentosFormatados = atendimentos.map(atendimento => ({
      ...atendimento.toJSON(),
      podeEditar: userCargo === 'administrador' || atendimento.profissionalId === profissionalId,
      podeDeletar: userCargo === 'administrador',
      podeCadastrar: userCargo === 'administrador' || userCargo === 'assistente social'
    }));

    return res.render('atendimentos/index', {
      atendimentos: atendimentosFormatados,
      searchTerm: search,
      dataInicio,
      dataFim,
      podeEditar: atendimentosFormatados.some(a => a.podeEditar),
      podeDeletar: atendimentosFormatados.some(a => a.podeDeletar),
      podeCadastrar: atendimentosFormatados.some(a => a.podeCadastrar)
    });
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

    const pacientes = await Paciente.findAll({
      attributes: ['id', 'nome', 'matricula'], 
      order: [['nome', 'ASC']]
    });

    return res.render('atendimentos/create', {
      profissionais,
      pacientes
    });
  } catch (error) {
    console.error('Erro ao buscar profissionais e pacientes:', error);
    req.flash('error_msg', 'Erro ao buscar profissionais e pacientes');
    return res.redirect('/atendimentos');
  }
};



exports.store = [
  body('nomePaciente').notEmpty().withMessage('O nome do paciente é obrigatório'),
  body('matriculaPaciente').isInt({ min: 1 }).withMessage('A matrícula do paciente deve ser um número positivo'),
  body('registroAtendimento').notEmpty().withMessage('O registro de atendimento é obrigatório'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(error => error.msg).join(', '));
      return res.redirect('/atendimentos/create');
    }

    try {
      const paciente = await Paciente.findOne({
        where: { matricula: req.body.matriculaPaciente }
      });

      if (!paciente) {
        req.flash('error', 'Paciente não encontrado com a matrícula fornecida.');
        return res.redirect('/atendimentos/create');
      }

      if (!req.user.profissionalId) {
        req.flash('error', 'Profissional não associado ao usuário logado.');
        return res.redirect('/atendimentos/create');
      }

      const atendimento = await Atendimento.create({
        nomePaciente: req.body.nomePaciente,
        matriculaPaciente: req.body.matriculaPaciente,
        assuntoAtendimento: req.body.assuntoAtendimento,
        registroAtendimento: req.body.registroAtendimento,
        dataAtendimento: new Date(),
        pacienteId: paciente.id, 
        profissionalId: req.user.profissionalId 
      });

      req.flash('success_msg', 'Atendimento criado com sucesso!');
      return res.redirect('/atendimentos');
    } catch (error) {
      console.error('Erro ao criar atendimento:', error);
      req.flash('error_msg', 'Erro ao criar atendimento. Tente novamente.');
      return res.redirect('/atendimentos/create');
    }
  }
];


exports.edit = async (req, res) => {
  try {
    const atendimento = await Atendimento.findByPk(req.params.id, {
      include: [{
        model: Profissional,
        as: 'profissional',
        attributes: ['id', 'nome']
      }]
    });

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
    req.flash('error_msg', 'Erro ao atualizar atendimento!');
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
          { '$paciente.nome$': { [Op.like]: `%${searchTerm}%` } },  
          { '$profissional.nome$': { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      include: [
        {
          model: Profissional,
          as: 'profissional',
          attributes: ['id', 'nome']
        },
        {
          model: Paciente,
          as: 'paciente', 
          attributes: ['id', 'nome']
        }
      ]
    });

    const atendimentosPorProfissional = await Atendimento.findAll({
      attributes: [
        'profissionalId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAtendimentos']
      ],
      group: ['profissionalId'],
      include: [
        {
          model: Profissional,
          as: 'profissional',
          attributes: ['id', 'nome']
        },
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['id', 'nome', 'matricula']
        }
      ]
    });

    const atendimentosPorMes = await Atendimento.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('dataAtendimento')), 'mes'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAtendimentos']
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


exports.show = async (req, res) => {
  try {
    const { id } = req.params;

    const atendimento = await Atendimento.findByPk(req.params.id, {
      include: [
        { 
          model: Profissional, 
          as: 'profissional' 
        },
        {
          model: DiscussaoCaso,
          as: 'discussaoCasos', 
          include: [
            { 
              model: Profissional, 
              as: 'profissional',
              attributes: ['id', 'nome'],
            }
          ]
        },
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['id', 'nome', 'matricula']
        }
      ]
    });

    if (!atendimento) {
      req.flash('error_msg', 'Atendimento não encontrado.');
      return res.redirect('/atendimentos');
    }

    res.render('atendimentos/detalhes', { atendimento, profissional: req.user.profissional });
  } catch (error) {
    console.error('Erro ao buscar detalhes do atendimento:', error);
    req.flash('error_msg', 'Erro ao buscar detalhes do atendimento.');
    res.redirect('/atendimentos');
  }
};

exports.buscarPaciente = async (req, res) => {
  try {
    const { nome, matricula } = req.query;

    if (!nome && !matricula) {
      return res.status(400).json({ error: "Informe um nome ou matrícula para buscar." });
    }

    let whereClause = {};

    if (nome && nome.length >= 3) {
      whereClause.nome = { [Op.iLike]: `%${nome}%` };  
    }

    if (matricula) {
      const matriculaInt = parseInt(matricula, 10);
      if (!isNaN(matriculaInt)) {
        whereClause.matricula = matriculaInt;
      }
    }

    const paciente = await Paciente.findOne({ where: whereClause });

    if (!paciente) {
      return res.status(404).json({ error: "Paciente não encontrado." });
    }

    return res.json(paciente); 
  } catch (error) {
    console.error("Erro ao buscar paciente:", error);
    return res.status(500).json({ error: "Erro ao buscar paciente." });
  }
};

exports.stats = async (req, res) => {
  try {
    const totalAtendimentos = await Atendimento.count();

    const atendimentosPorMes = await Atendimento.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('dataAtendimento')), 'mes'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAtendimentos']
      ],
      group: [sequelize.fn('MONTH', sequelize.col('dataAtendimento'))],
      order: [[sequelize.fn('MONTH', sequelize.col('dataAtendimento')), 'ASC']]
    });

    const atendimentosPorProfissional = await Atendimento.findAll({
      attributes: [
        'profissionalId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAtendimentos']
      ],
      group: ['profissionalId'],
      include: [
        {
          model: Profissional,
          as: 'profissional',
          attributes: ['id', 'nome']
        }
      ]
    });

    return res.render('graficos/index', {
      totalAtendimentos,
      atendimentosPorMes,
      atendimentosPorProfissional
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de atendimentos:', error);
    return res.status(500).json({ message: 'Erro ao buscar estatísticas de atendimentos.' });
  }
};