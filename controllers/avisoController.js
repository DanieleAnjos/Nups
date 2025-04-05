const Aviso = require('../models/Aviso');
const Profissional = require('../models/Profissional');
const AvisoVisualizado = require('../models/AvisoVisualizado');
const { Op } = require('sequelize');
const moment = require('moment-timezone');

// utils/cargos.js
function getCargosPermitidos(cargoUsuario) {
  const cargosGestores = {
    'Gestor Servico Social': 'Assistente social',
    'Gestor Psicologia': 'Psicólogo',
    'Gestor Psiquiatria': 'Psiquiatra',
    'Gestor Adms': 'Adm'
  };

  const cargosAdministradores = ['Administrador', 'Adm', 'Gestor Adms'];
  const cargosProfissionais = ['Assistente social', 'Psicólogo', 'Psiquiatra', 'Adm'];

  if (cargosAdministradores.includes(cargoUsuario)) {
    return ['Geral', ...cargosProfissionais];
  }

  if (cargosGestores[cargoUsuario]) {
    return [cargosGestores[cargoUsuario]];
  }

  if (cargosProfissionais.includes(cargoUsuario)) {
    return [cargoUsuario];
  }

  return ['Geral'];
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

    // Verifica se o cargoAlvo é permitido
    if (cargoAlvo && !cargosPermitidos.includes(cargoAlvo)) {
      return res.render('avisos/create', {
        title: 'Novo Aviso',
        error: 'Cargo alvo não permitido para o seu cargo.'
      });
    }

    // Converte a data para o formato esperado pelo banco
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
        error : 'Profissional não encontrado.'
      });
    }

    const { nomeProfissional, dataInicio, dataFim } = req.query;
    const whereConditions = {};

    // Filtra por nome do profissional (se fornecido)
    if (nomeProfissional && typeof nomeProfissional === 'string') {
      whereConditions['$profissional.nome$'] = { [Op.like]: `%${nomeProfissional}%` };
    }

    // Filtra por intervalo de datas (se fornecido)
    if (dataInicio && !isNaN(Date.parse(dataInicio))) {
      const dataInicioFormatada = moment.tz(dataInicio, 'America/Sao_Paulo').startOf('day').toDate();
      whereConditions.data = { [Op.gte]: dataInicioFormatada };

      if (dataFim && !isNaN(Date.parse(dataFim))) {
        const dataFimFormatada = moment.tz(dataFim, 'America/Sao_Paulo').endOf('day').toDate();
        whereConditions.data[Op.lte] = dataFimFormatada;
      }
    }

    // Busca todos os avisos (sem filtro por cargo)
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

    // Formata a data dos avisos e adiciona a flag `podeEditar`
    const avisosFormatados = avisos.map(aviso => {
      const podeEditar =
        req.user.cargo === 'Administrador' ||
        req.user.cargo === 'Adm' ||
        req.user.profissionalId === aviso.profissional.id;

      return {
        ...aviso.get({ plain: true }),
        data: moment(aviso.data).format('DD/MM/YYYY'),
        podeEditar // Adiciona a flag de permissão
      };
    });

    res.render('avisos/index', {
      title: 'Lista de Avisos',
      avisos: avisosFormatados,
      user: req.user, // Passa o usuário logado
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

    // Filtra avisos com base no cargo do usuário
    const cargosPermitidos = getCargosPermitidos(cargoProfissional);
    whereConditions[Op.or] = [
      { cargoAlvo: 'Geral' },
      { cargoAlvo: { [Op.in]: cargosPermitidos } }
    ];

    const avisosDoDia = await Aviso.findAll({
      where: whereConditions,
      include: [
        {
          model: Profissional,
          as: 'profissional',
          attributes: ['id', 'nome', 'cargo']
        },
        {
          model: Profissional,
          as: 'visualizadoPor',
          attributes: ['id', 'nome', 'cargo'],
          through: { attributes: ['vistoEm'] }
        }
      ],
      order: [['data', 'ASC']]
    });

    const todosProfissionais = await Profissional.findAll({
      attributes: ['id', 'nome', 'cargo']
    });

    const avisosFormatados = avisosDoDia.map(aviso => {
      const profissionaisAlvo = todosProfissionais.filter(profissional => {
        return aviso.cargoAlvo === 'Geral' || profissional.cargo === aviso.cargoAlvo;
      });

      const profissionaisVisualizaram = aviso.visualizadoPor.filter(visto => {
        return profissionaisAlvo.some(profissional => profissional.id === visto.id);
      });

      const profissionaisNaoVisualizaram = profissionaisAlvo.filter(profissional => {
        return !profissionaisVisualizaram.some(visto => visto.id === profissional.id);
      });

      const jaVisualizado = aviso.visualizadoPor.some(visto => visto.id === req.user.profissionalId);

      return {
        ...aviso.get({ plain: true }),
        data: moment(aviso.data).format('DD/MM/YYYY'),
        visualizadoPor: profissionaisVisualizaram,
        naoVisualizadoPor: profissionaisNaoVisualizaram,
        jaVisualizado
      };
    });

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

    const cargosPermitidos = getCargosPermitidos(cargoProfissional);
    whereConditions[Op.or] = [
      { cargoAlvo: 'Geral' },
      { cargoAlvo: { [Op.in]: cargosPermitidos } }
    ];

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

// Marcar aviso como visto
exports.marcarAvisoComoVisto = async (req, res) => {
  try {
    const { id } = req.params;
    const profissionalId = req.user?.profissionalId;

    if (!profissionalId) {
      return res.status(403).json({ error: 'Usuário não autenticado.' });
    }

    const aviso = await Aviso.findByPk(id);
    if (!aviso) {
      return res.status(404).json({ error: 'Aviso não encontrado.' });
    }

    const [avisoVisualizado, created] = await AvisoVisualizado.findOrCreate({
      where: { avisoId: id, profissionalId },
      defaults: { vistoEm: new Date() }
    });

    if (!created) {
      return res.status(200).json({ message: 'Aviso já marcado como visto.' });
    }

    res.status(200).json({ message: 'Aviso marcado como visto.', avisoId: id });
  } catch (error) {
    console.error('Erro ao marcar aviso como visto:', error);
    res.status(500).json({ error: 'Erro ao marcar aviso como visto.' });
  }
};


exports.listarVisualizacoesAviso = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar o aviso específico e incluir os profissionais que visualizaram
    const aviso = await Aviso.findByPk(id, {
      include: [
        {
          model: Profissional,
          as: 'visualizadoPor',
          attributes: ['id', 'nome', 'cargo'],
          through: { attributes: ['vistoEm'] }
        }
      ]
    });

    if (!aviso) {
      return res.render('avisos/visualizacoes', {
        title: 'Visualizações do Aviso',
        error: 'Aviso não encontrado.'
      });
    }

    // Buscar todos os profissionais
    const todosProfissionais = await Profissional.findAll({
      attributes: ['id', 'nome', 'cargo']
    });

    // Definir os profissionais que são alvo deste aviso
    const profissionaisAlvo = todosProfissionais.filter(profissional => 
      aviso.cargoAlvo === 'Geral' || profissional.cargo === aviso.cargoAlvo
    );

    // Filtrar os profissionais que visualizaram o aviso
    const profissionaisVisualizaram = aviso.visualizadoPor.filter(visto => 
      profissionaisAlvo.some(profissional => profissional.id === visto.id)
    );

    // Filtrar os profissionais que ainda não visualizaram o aviso
    const profissionaisNaoVisualizaram = profissionaisAlvo.filter(profissional => 
      !profissionaisVisualizaram.some(visto => visto.id === profissional.id)
    );

    res.render('avisos/visualizacoes', {
      title: 'Visualizações do Aviso',
      aviso: {
        id: aviso.id,
        assunto: aviso.assunto,
        mensagem: aviso.mensagem,
        data: moment(aviso.data).format('DD/MM/YYYY HH:mm')
      },
      visualizadoPor: profissionaisVisualizaram,
      naoVisualizadoPor: profissionaisNaoVisualizaram
    });

  } catch (error) {
    console.error('Erro ao listar visualizações do aviso:', error);
    res.render('avisos/visualizacoes', {
      title: 'Visualizações do Aviso',
      error: 'Erro ao listar visualizações do aviso.',
      details: error.message
    });
  }
};

