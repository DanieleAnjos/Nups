const Aviso = require('../models/Aviso'); // Caminho correto?
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize');


// Renderiza a página de criação de aviso

// Criar um novo aviso
const moment = require('moment-timezone');

// Função para obter os cargos permitidos com base no cargo do usuário
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
};


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

    res.render('avisos/create', { 
      title: 'Novo Aviso',
      cargosPermitidos // Passa a lista de cargos permitidos para o formulário
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

    const avisosDoDia = await Aviso.findAll({
      where: {
        data: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
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
      error: 'Erro ao buscar avisos do dia', 
      details: error.message 
    });
  }
};



// Renderiza a página de edição de um aviso 

// Atualizar aviso
  exports.updateAviso = async (req, res) => {
    try {
      const { id } = req.params;
      const { assunto, mensagem, data, tipo } = req.body;
  
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
  
      // Convertendo a data para o formato correto
      const moment = require('moment');
      const dataFormatada = moment(data).tz('America/Sao_Paulo').toDate();
  
      // Atualizando o aviso
      await aviso.update({ assunto, mensagem, data: dataFormatada, tipo });
  
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
    // Obtendo a data do início e fim do dia atual
    const startOfDay = moment().tz('America/Sao_Paulo').startOf('day').toDate();
    const endOfDay = moment().tz('America/Sao_Paulo').endOf('day').toDate();
    
    // Contando avisos dentro do intervalo de data do dia
    const avisosDoDia = await Aviso.count({
      where: {
        data: {
          [Op.between]: [startOfDay, endOfDay], // Filtra avisos dentro do dia atual
        }
      }
    });

    return res.json({ avisosDoDia });  // Retorna a contagem em formato JSON
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao contar avisos do dia.' });  // Retorna erro em formato JSON
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


