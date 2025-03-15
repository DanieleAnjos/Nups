const Aviso = require('../models/Aviso'); // Caminho correto?
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize');


// utils/cargos.js
function getCargosPermitidos(cargoUsuario) {
  const cargos = [
    'Assistente social',
    'Psicólogo',
    'Psiquiatra',
    'Adm'
  ];

  if (['Administrador', 'Adm'].includes(cargoUsuario)) {
    return ['Geral', ...cargos]; // Administradores podem enviar para todos ou por cargo
  } else if (cargoUsuario.startsWith('Gestor')) {
    // Mapeia o cargo do gestor para o cargo correspondente
    const cargoCorrespondente = cargoUsuario.replace('Gestor ', '');
    return [cargoCorrespondente]; // Gestores só podem enviar para o cargo correspondente
  } else if (cargos.includes(cargoUsuario)) {
    return [cargoUsuario]; // Outros profissionais podem enviar para o seu cargo e avisos gerais
  } else {
    return ['Geral']; // Caso o cargo não esteja na lista, permite apenas avisos gerais
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

    // Obtém o profissional logado
    const profissional = await Profissional.findByPk(profissionalId, {
      attributes: ['id', 'nome', 'cargo']
    });

    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado.' });
    }

    const cargoProfissional = profissional.cargo;

    // Condição para filtrar avisos
    const whereConditions = {
      data: {
        [Op.between]: [startOfDay, endOfDay] // Filtra avisos dentro do dia atual
      }
    };

    // Verifica se o profissional é administrador
    if (['Administrador', 'Adm'].includes(cargoProfissional)) {
      // Administradores podem ver todos os avisos
      // Não aplicamos nenhum filtro adicional
    } else {
      // Para gestores e outros profissionais, aplicamos o filtro por cargo
      const cargosPermitidos = getCargosPermitidos(cargoProfissional);

      // Se o profissional for um gestor ou tiver cargos permitidos, filtra os avisos
      if (cargosPermitidos && cargosPermitidos.length > 0) {
        whereConditions[Op.or] = [
          { cargoAlvo: 'Geral' }, // Avisos gerais
          { cargoAlvo: { [Op.in]: cargosPermitidos } } // Avisos específicos para os cargos permitidos
        ];
      } else {
        // Se não houver cargos permitidos, retorna uma lista vazia
        return res.render('avisos/do-dia', {
          title: 'Avisos do Dia',
          avisos: [],
          profissional,
          message: 'Nenhum aviso disponível para o seu cargo.'
        });
      }
    }

    // Busca os avisos do dia com as condições aplicadas
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

    // Formata a data dos avisos para exibição
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

    // Obtém o profissional logado
    const profissional = await Profissional.findByPk(profissionalId, {
      attributes: ['cargo']
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado.' });
    }

    const cargoProfissional = profissional.cargo;

    // Obtendo a data do início e fim do dia atual
    const startOfDay = moment().tz('America/Sao_Paulo').startOf('day').toDate();
    const endOfDay = moment().tz('America/Sao_Paulo').endOf('day').toDate();

    // Condição para filtrar avisos
    const whereConditions = {
      data: {
        [Op.between]: [startOfDay, endOfDay], // Filtra avisos dentro do dia atual
      }
    };

    // Verifica se o profissional é administrador
    if (['Administrador', 'Adm'].includes(cargoProfissional)) {
      // Administradores podem ver todos os avisos
      // Não aplicamos nenhum filtro adicional
    } else {
      // Para gestores e outros profissionais, aplicamos o filtro por cargo
      const cargosPermitidos = getCargosPermitidos(cargoProfissional);

      // Se o profissional for um gestor ou tiver cargos permitidos, filtra os avisos
      if (cargosPermitidos && cargosPermitidos.length > 0) {
        whereConditions[Op.or] = [
          { cargoAlvo: 'Geral' }, // Avisos gerais
          { cargoAlvo: { [Op.in]: cargosPermitidos } } // Avisos específicos para os cargos permitidos
        ];
      } else {
        // Se não houver cargos permitidos, retorna 0 avisos
        return res.json({ avisosDoDia: 0 });
      }
    }

    // Conta os avisos do dia com as condições aplicadas
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

    // Verifica se o ID é válido
    if (isNaN(id)) {
      return res.render('avisos/index', {
        title: 'Lista de Avisos',
        error: 'ID inválido'
      });
    }

    // Busca o aviso pelo ID
    const aviso = await Aviso.findByPk(id);
    if (!aviso) {
      return res.render('avisos/index', {
        title: 'Lista de Avisos',
        error: 'Aviso não encontrado'
      });
    }

    // Obtém o profissional logado
    const profissional = await Profissional.findByPk(req.user.profissionalId, {
      attributes: ['cargo']
    });

    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado.' });
    }

    // Obtém os cargos permitidos para o profissional logado
    const cargosPermitidos = getCargosPermitidos(profissional.cargo);
    const isGeralPermitido = cargosPermitidos.includes('Geral');

    // Formata a data para o campo input type="date"
    const dataFormatada = moment(aviso.data).format('YYYY-MM-DD');

    // Renderiza a página de edição com os dados do aviso e cargos permitidos
    res.render('avisos/edit', {
      title: 'Editar Aviso',
      aviso: {
        ...aviso.get({ plain: true }), // Converte o modelo Sequelize para um objeto simples
        data: dataFormatada // Formata a data para o campo input type="date"
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

