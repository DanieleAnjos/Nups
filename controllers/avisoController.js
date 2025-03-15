const Aviso = require('../models/Aviso');
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize');
const moment = require('moment-timezone');

// utils/cargos.js
function getCargosPermitidos(cargoUsuario) {
  const cargos = [
    'Assistente social',
    'Psicólogo',
    'Psiquiatra',
    'Adm',
    'Administrador' // Adicionado para evitar problemas com "Gestor Administrador"
  ];

  if (['Administrador', 'Adm'].includes(cargoUsuario)) {
    return ['Geral', ...cargos];
  } else if (cargoUsuario.startsWith('Gestor')) {
    const cargoCorrespondente = cargoUsuario.replace('Gestor ', '');
    return [cargoCorrespondente];
  } else if (cargos.includes(cargoUsuario)) {
    return [cargoUsuario];
  } else {
    return ['Geral'];
  }
}

// Renderiza a página de criação de aviso
exports.renderCreateAviso = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.user.profissionalId, {
      attributes: ['cargo']
    });

    if (!profissional) {
      return res.render('avisos/create', {
        title: 'Novo Aviso',
        error: 'Profissional não encontrado.'
      });
    }

    const cargosPermitidos = getCargosPermitidos(profissional.cargo);
    const isGeralPermitido = cargosPermitidos.includes('Geral');

    res.render('avisos/create', {
      title: 'Novo Aviso',
      cargosPermitidos,
      isGeralPermitido
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de aviso:', error);
    res.render('avisos/create', {
      title: 'Novo Aviso',
      error: 'Erro ao carregar formulário de aviso',
      details: error.message
    });
  }
};

// Criar um novo aviso
exports.createAviso = async (req, res) => {
  try {
    const { assunto, mensagem, data, tipo, cargoAlvo } = req.body;
    const profissionalId = req.user.profissionalId;

    if (!assunto || !mensagem || !data || !tipo) {
      return res.render('avisos/create', {
        title: 'Novo Aviso',
        error: 'Todos os campos são obrigatórios'
      });
    }

    if (cargoAlvo && typeof cargoAlvo !== 'string') {
      return res.render('avisos/create', {
        title: 'Novo Aviso',
        error: 'Cargo alvo inválido.'
      });
    }

    const profissional = await Profissional.findByPk(profissionalId, {
      attributes: ['cargo']
    });

    if (!profissional) {
      return res.render('avisos/create', {
        title: 'Novo Aviso',
        error: 'Profissional não encontrado.'
      });
    }

    const cargosPermitidos = getCargosPermitidos(profissional.cargo);

    if (cargoAlvo && !cargosPermitidos.includes(cargoAlvo)) {
      return res.render('avisos/create', {
        title: 'Novo Aviso',
        error: 'Cargo alvo não permitido para o seu cargo.'
      });
    }

    const dataFormatada = moment.tz(data, 'America/Sao_Paulo').toDate();

    await Aviso.create({ assunto, mensagem, data: dataFormatada, tipo, cargoAlvo, profissionalId });

    req.flash('success_msg', 'Aviso criado com sucesso');
    res.redirect('/avisos');
  } catch (error) {
    console.error('Erro ao criar aviso:', error);
    req.flash('error_msg', 'Erro ao criar aviso');
    res.render('avisos/create', {
      title: 'Novo Aviso',
      error: 'Erro ao criar aviso',
      details: error.message
    });
  }
};

// Listar todos os avisos
exports.getAllAvisos = async (req, res) => {
  try {
    const profissionalId = req.user.profissionalId;

    const profissional = await Profissional.findByPk(profissionalId, {
      attributes: ['id', 'nome', 'cargo']
    });

    if (!profissional) {
      return res.render('avisos/index', {
        title: 'Lista de Avisos',
        error: 'Profissional não encontrado.'
      });
    }

    const { nomeProfissional, dataInicio } = req.query;
    const whereConditions = {};

    if (nomeProfissional && typeof nomeProfissional === 'string') {
      whereConditions['$profissional.nome$'] = { [Op.like]: `%${nomeProfissional}%` };
    }

    if (dataInicio && !isNaN(Date.parse(dataInicio))) {
      const dataFormatada = moment.tz(dataInicio, 'America/Sao_Paulo').startOf('day').toDate();
      whereConditions.data = { [Op.eq]: dataFormatada };
    }

    const avisos = await Aviso.findAll({
      where: whereConditions,
      include: [
        {
          model: Profissional,
          as: 'profissional',
          attributes: ['id', 'nome', 'cargo']
        }
      ],
      order: [['data', 'DESC']]
    });

    res.render('avisos/index', {
      title: 'Lista de Avisos',
      avisos,
      query: req.query
    });
  } catch (error) {
    console.error('Erro ao buscar avisos:', error);
    res.render('avisos/index', {
      title: 'Lista de Avisos',
      avisos: [],
      error: 'Erro ao buscar avisos.',
      details: error.message
    });
  }
};

// Obter avisos do dia
exports.getAvisosDoDia = async (req, res) => {
  try {
    const startOfDay = moment.tz('America/Sao_Paulo').startOf('day').toDate();
    const endOfDay = moment.tz('America/Sao_Paulo').endOf('day').toDate();

    const profissionalId = req.user.profissionalId;

    const profissional = await Profissional.findByPk(profissionalId, {
      attributes: ['id', 'nome', 'cargo']
    });

    if (!profissional) {
      return res.render('avisos/do-dia', {
        title: 'Avisos do Dia',
        avisos: [],
        error: 'Profissional não encontrado.'
      });
    }

    const cargoProfissional = profissional.cargo;

    const whereConditions = {
      data: {
        [Op.between]: [startOfDay, endOfDay]
      }
    };

    if (['Administrador', 'Adm'].includes(cargoProfissional)) {
      // Administradores podem ver todos os avisos
    } else {
      const cargosPermitidos = getCargosPermitidos(cargoProfissional);

      if (cargosPermitidos && cargosPermitidos.length > 0) {
        whereConditions[Op.or] = [
          { cargoAlvo: 'Geral' },
          { cargoAlvo: { [Op.in]: cargosPermitidos } }
        ];
      } else {
        return res.render('avisos/do-dia', {
          title: 'Avisos do Dia',
          avisos: [],
          profissional,
          message: 'Nenhum aviso disponível para o seu cargo.'
        });
      }
    }

    const avisosDoDia = await Aviso.findAll({
      where: whereConditions,
      include: [
        {
          model: Profissional,
          as: 'profissional',
          attributes: ['id', 'nome', 'cargo']
        }
      ],
      order: [['data', 'ASC']]
    });

    const avisosFormatados = avisosDoDia.map(aviso => ({
      ...aviso.get({ plain: true }),
      data: moment(aviso.data).format('DD/MM/YYYY HH:mm')
    }));

    res.render('avisos/do-dia', {
      title: 'Avisos do Dia',
      avisos: avisosFormatados,
      profissional
    });
  } catch (error) {
    console.error('Erro ao buscar avisos do dia:', error);
    res.render('avisos/do-dia', {
      title: 'Avisos do Dia',
      avisos: [],
      profissional: null,
      error: 'Erro ao buscar avisos do dia',
      details: error.message
    });
  }
};

// Atualizar aviso
exports.updateAviso = async (req, res) => {
  try {
    const { id } = req.params;
    const { assunto, mensagem, data, tipo, cargoAlvo } = req.body;

    if (isNaN(id)) {
      req.flash('error_msg', 'ID inválido');
      return res.redirect('/avisos');
    }

    const aviso = await Aviso.findByPk(id);
    if (!aviso) {
      req.flash('error_msg', 'Aviso não encontrado');
      return res.redirect('/avisos');
    }

    if (cargoAlvo && typeof cargoAlvo !== 'string') {
      return res.render('avisos/edit', {
        title: 'Editar Aviso',
        error: 'Cargo alvo inválido.'
      });
    }

    const profissional = await Profissional.findByPk(req.user.profissionalId, {
      attributes: ['cargo']
    });

    if (!profissional) {
      return res.render('avisos/edit', {
        title: 'Editar Aviso',
        error: 'Profissional não encontrado.'
      });
    }

    const cargosPermitidos = getCargosPermitidos(profissional.cargo);

    if (cargoAlvo && !cargosPermitidos.includes(cargoAlvo)) {
      return res.render('avisos/edit', {
        title: 'Editar Aviso',
        error: 'Cargo alvo não permitido para o seu cargo.'
      });
    }

    const dataFormatada = moment.tz(data, 'America/Sao_Paulo').toDate();

    await aviso.update({ assunto, mensagem, data: dataFormatada, tipo, cargoAlvo });

    req.flash('success_msg', 'Aviso atualizado com sucesso.');
    res.redirect('/avisos');
  } catch (error) {
    console.error('Erro ao atualizar aviso:', error);
    res.render('avisos/edit', {
      title: 'Editar Aviso',
      error: 'Erro ao atualizar aviso',
      details: error.message
    });
  }
};

// Excluir aviso (exclusão lógica)
exports.deleteAviso = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      req.flash('error_msg', 'ID inválido');
      return res.redirect('/avisos');
    }

    const aviso = await Aviso.findByPk(id);
    if (!aviso) {
      req.flash('error_msg', 'Aviso não encontrado');
      return res.redirect('/avisos');
    }

    await aviso.destroy();
    req.flash('success_msg', 'Aviso deletado.');
    res.redirect('/avisos');
  } catch (error) {
    console.error('Erro ao excluir aviso:', error);
    res.render('avisos/index', {
      title: 'Lista de Avisos',
      error: 'Erro ao excluir aviso',
      details: error.message
    });
  }
};

// Contar avisos do dia
exports.contarAvisosDoDia = async (req, res) => {
  try {
    const profissionalId = req.user.profissionalId;

    const profissional = await Profissional.findByPk(profissionalId, {
      attributes: ['cargo']
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado.' });
    }

    const cargoProfissional = profissional.cargo;

    const startOfDay = moment().tz('America/Sao_Paulo').startOf('day').toDate();
    const endOfDay = moment().tz('America/Sao_Paulo').endOf('day').toDate();

    const whereConditions = {
      data: {
        [Op.between]: [startOfDay, endOfDay]
      }
    };

    if (['Administrador', 'Adm'].includes(cargoProfissional)) {
      // Administradores podem ver todos os avisos
    } else {
      const cargosPermitidos = getCargosPermitidos(cargoProfissional);

      if (cargosPermitidos && cargosPermitidos.length > 0) {
        whereConditions[Op.or] = [
          { cargoAlvo: 'Geral' },
          { cargoAlvo: { [Op.in]: cargosPermitidos } }
        ];
      } else {
        return res.json({ avisosDoDia: 0 });
      }
    }

    const avisosDoDia = await Aviso.count({
      where: whereConditions
    });

    return res.json({ avisosDoDia });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao contar avisos do dia.' });
  }
};

// Renderizar página de edição de aviso
exports.renderEditAviso = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      req.flash('error_msg', 'ID inválido');
      return res.redirect('/avisos');
    }

    const aviso = await Aviso.findByPk(id);
    if (!aviso) {
      req.flash('error_msg', 'Aviso não encontrado');
      return res.redirect('/avisos');
    }

    const profissional = await Profissional.findByPk(req.user.profissionalId, {
      attributes: ['cargo']
    });

    if (!profissional) {
      return res.render('avisos/edit', {
        title: 'Editar Aviso',
        error: 'Profissional não encontrado.'
      });
    }

    const cargosPermitidos = getCargosPermitidos(profissional.cargo);
    const isGeralPermitido = cargosPermitidos.includes('Geral');

    const dataFormatada = moment(aviso.data).format('YYYY-MM-DD');

    res.render('avisos/edit', {
      title: 'Editar Aviso',
      aviso: {
        ...aviso.get({ plain: true }),
        data: dataFormatada
      },
      cargosPermitidos,
      isGeralPermitido
    });
  } catch (error) {
    console.error('Erro ao carregar aviso para edição:', error);
    res.render('avisos/index', {
      title: 'Lista de Avisos',
      error: 'Erro ao carregar aviso para edição',
      details: error.message
    });
  }
};