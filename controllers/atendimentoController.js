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
    const searchTerm = req.query.search || '';
    const dataInicio = req.query.dataInicio || '';
    const dataFim = req.query.dataFim || '';

    const profissionalId = req.user.profissionalId;

    const profissional = await Profissional.findByPk(profissionalId, {
      attributes: ['cargo']
    });

    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado.' });
    }

    const profissionalCargo = profissional.cargo.toLowerCase();

    // Filtro por intervalo de datas
    const dateFilter = {};
    if (dataInicio && dataFim) {
      // Filtro entre duas datas
      const inicio = new Date(dataInicio);
      inicio.setHours(0, 0, 0, 0); // Início do dia
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999); // Fim do dia

      dateFilter.createdAt = {
        [Op.between]: [inicio, fim]
      };
    } else if (dataInicio) {
      // Filtro a partir de uma data
      const inicio = new Date(dataInicio);
      inicio.setHours(0, 0, 0, 0); // Início do dia

      dateFilter.createdAt = {
        [Op.gte]: inicio
      };
    } else if (dataFim) {
      // Filtro até uma data
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999); // Fim do dia

      dateFilter.createdAt = {
        [Op.lte]: fim
      };
    }

    // Mapeamento de cargos para gestores
    const gestorCargosMap = {
      'gestor servico social': ['Assistente social'],
      'gestor psicologia': ['Psicólogo'],
      'gestor psiquiatria': ['Psiquiatra']
    };

    // Configura o filtro de cargo
    let cargoFilter = {};
    if (gestorCargosMap[profissionalCargo]) {
      // Se for um gestor, filtra pelos cargos que ele gerencia
      const cargosPermitidos = gestorCargosMap[profissionalCargo];
      cargoFilter = { cargo: { [Op.in]: cargosPermitidos } };
    } else if (!['administrador', 'adm'].includes(profissionalCargo)) {
      // Se não for gestor nem administrador, filtra pelo próprio cargo
      cargoFilter = { cargo: profissionalCargo };
    }

    // Configura os includes com os filtros
    const includeConditions = [
      {
        model: Profissional,
        as: 'profissional',
        attributes: ['id', 'nome', 'cargo'],
        where: cargoFilter
      },
      {
        model: Paciente,
        as: 'paciente',
        attributes: ['id', 'nome'],
        where: searchTerm ? { nome: { [Op.like]: `%${searchTerm}%` } } : {} // Filtro pelo nome do paciente
      }
    ];

    const atendimentos = await Atendimento.findAll({
      where: dateFilter,
      include: includeConditions,
      order: [['createdAt', 'DESC']]
    });

    // Permissões
    const podeEditar = ['administrador', 'assistente social'].includes(profissionalCargo);
    const podeDeletar = profissionalCargo === 'administrador';
    const podeCadastrar = podeEditar;

    return res.status(200).render('atendimentos/index', {
      atendimentos,
      searchTerm,
      dataInicio,
      dataFim,
      podeEditar,
      podeDeletar,
      podeCadastrar
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

      await Notificacao.create({
        titulo: `Novo Atendimento: ${req.body.registroAtendimento}`,
        mensagem: `Você realizou um novo atendimento para o paciente ${req.body.nomePaciente}, matrícula: ${req.body.matriculaPaciente}.`,
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
              as: 'profissional' 
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

    res.render('atendimentos/detalhes', { atendimento });
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