const Aviso = require('../models/Aviso'); // Caminho correto?
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize');


// utils/cargos.js
function getCargosPermitidos(cargoUsuario) {
  const cargos = [
    'Assistente social',
    'Psicólogo',
    'Psiquiatra'
  ];

  if (['Administrador', 'Adm'].includes(cargoUsuario)) {
    return ['Geral', ...cargos]; // Administradores podem enviar para todos ou por cargo
  } else if (cargoUsuario.startsWith('Gestor')) {
    // Mapeia o cargo do gestor para o cargo correspondente
    const cargoCorrespondente = cargoUsuario.replace('Gestor ', '');
    return [cargoCorrespondente]; // Gestores só podem enviar para o cargo correspondente
  } else {
    return []; // Outros profissionais não podem enviar avisos por cargo
  }
}

// Renderiza a página de criação de aviso
exports.renderCreateAviso = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.user.profissionalId, {
      attributes: ['cargo']
    });

    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado.' });
    }

    const cargosPermitidos = getCargosPermitidos(profissional.cargo);
    const isGeralPermitido = cargosPermitidos.includes('Geral');

    res.render('avisos/create', { 
      title: 'Novo Aviso',
      cargosPermitidos,
      isGeralPermitido // Passa essa informação para o template
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
const moment = require('moment-timezone');

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
      return res.status(404).json({ message: 'Profissional não encontrado.' });
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
      return res.status(404).json({ message: 'Profissional não encontrado.' });
    }

    const { nomeProfissional, dataInicio } = req.query;
    const whereConditions = {};

    if (nomeProfissional) {
      whereConditions['$profissional.nome$'] = { [Op.like]: `%${nomeProfissional}%` };
    }

    if (dataInicio) {
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


exports.getAvisosDoDia = async (req, res) => {
  try {
    const startOfDay = moment.tz('America/Sao_Paulo').startOf('day').toDate();
    const endOfDay = moment.tz('America/Sao_Paulo').endOf('day').toDate();

    console.log('Buscando avisos entre:', startOfDay, 'e', endOfDay);

    const profissionalId = req.user.profissionalId;

    const profissional = await Profissional.findByPk(profissionalId, {
      attributes: ['id', 'nome', 'cargo']
    });

    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado.' });
    }

    const cargoProfissional = profissional.cargo;

    const whereConditions = {
      data: {
        [Op.between]: [startOfDay, endOfDay] // Filtra avisos dentro do dia atual
      }
    };

    if (['Administrador', 'Adm'].includes(cargoProfissional)) {
      // Administradores podem ver todos os avisos
      // Não aplicamos nenhum filtro adicional
    } else {
      const cargosPermitidos = getCargosPermitidos(cargoProfissional);

      if (cargosPermitidos.length > 0) {
        whereConditions[Op.or] = [
          { cargoAlvo: 'Geral' }, // Avisos gerais
          { cargoAlvo: { [Op.in]: cargosPermitidos } } // Avisos específicos para os cargos permitidos
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

    res.render('avisos/do-dia', {
      title: 'Avisos do Dia',
      avisos: avisosDoDia,
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

exports.updateAviso = async (req, res) => {
  try {
    const { id } = req.params;
    const { assunto, mensagem, data, tipo, cargoAlvo } = req.body;

    if (isNaN(id)) {
      return res.render('avisos/index', { 
        title: 'Lista de Avisos', 
        error: 'ID inválido' 
      });
    }

    const aviso = await Aviso.findByPk(id);
    if (!aviso) {
      return res.render('avisos/index', { 
        title: 'Lista de Avisos', 
        error: 'Aviso não encontrado' 
      });
    }

    const profissional = await Profissional.findByPk(req.user.profissionalId, {
      attributes: ['cargo']
    });

    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado.' });
    }

    const cargosPermitidos = getCargosPermitidos(profissional.cargo);

    // Se o cargoAlvo foi fornecido e não está na lista de cargos permitidos, retorna erro
    if (cargoAlvo && !cargosPermitidos.includes(cargoAlvo)) {
      return res.render('avisos/edit', { 
        title: 'Editar Aviso', 
        error: 'Cargo alvo não permitido para o seu cargo.' 
      });
    }

    // Convertendo a data para o formato correto
    const moment = require('moment');
    const dataFormatada = moment(data).tz('America/Sao_Paulo').toDate();

    // Atualizando o aviso
    await aviso.update({ assunto, mensagem, data: dataFormatada, tipo, cargoAlvo });

    req.flash('success_msg', 'Aviso atualizado com sucesso.');
    console.log('Aviso atualizado com sucesso', aviso);
    res.redirect('/avisos'); // Redireciona para a lista de avisos
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
      return res.render('avisos/index', { 
        title: 'Lista de Avisos', 
        error: 'ID inválido' 
      });
    }

    const aviso = await Aviso.findByPk(id);
    if (!aviso) {
      return res.render('avisos/index', { 
        title: 'Lista de Avisos', 
        error: 'Aviso não encontrado' 
      });
    }

    await aviso.destroy(); // Exclusão lógica se `paranoid: true` estiver ativado
    req.flash('success_msg',"Aviso deletado.")
    res.redirect('/avisos'); // Redireciona para a lista de avisos
  } catch (error) {
    console.error('Erro ao excluir aviso:', error);
    res.render('avisos/index', { 
      title: 'Lista de Avisos', 
      error: 'Erro ao excluir aviso', 
      details: error.message 
    });
  }
};

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
        [Op.between]: [startOfDay, endOfDay], // Filtra avisos dentro do dia atual
      }
    };

    if (['Administrador', 'Adm'].includes(cargoProfissional)) {
      // Administradores podem ver todos os avisos
      // Não aplicamos nenhum filtro adicional
    } else {
      const cargosPermitidos = getCargosPermitidos(cargoProfissional);

      if (cargosPermitidos.length > 0) {
        whereConditions[Op.or] = [
          { cargoAlvo: 'Geral' }, // Avisos gerais
          { cargoAlvo: { [Op.in]: cargosPermitidos } } // Avisos específicos para os cargos permitidos
        ];
      } else {
        return res.json({ avisosDoDia: 0 });
      }
    }

    const avisosDoDia = await Aviso.count({
      where: whereConditions
    });

    return res.json({ avisosDoDia }); // Retorna a contagem em formato JSON
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao contar avisos do dia.' }); // Retorna erro em formato JSON
  }
};

exports.renderEditAviso = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.render('avisos/index', { 
        title: 'Lista de Avisos', 
        error: 'ID inválido' 
      });
    }

    const aviso = await Aviso.findByPk(id);
    if (!aviso) {
      return res.render('avisos/index', { 
        title: 'Lista de Avisos', 
        error: 'Aviso não encontrado' 
      });
    }

    res.render('avisos/edit', { title: 'Editar Aviso', aviso });
  } catch (error) {
    console.error('Erro ao carregar aviso para edição:', error);
    res.render('avisos/index', { 
      title: 'Lista de Avisos', 
      error: 'Erro ao carregar aviso para edição', 
      details: error.message 
    });
  }
};


