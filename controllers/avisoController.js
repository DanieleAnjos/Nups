const Aviso = require('../models/Aviso'); // Caminho correto?
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize');
const moment = require('moment');


// Renderiza a página de criação de aviso
exports.renderCreateAviso = (req, res) => {
  res.render('avisos/create', { title: 'Novo Aviso' });
};

// Criar um novo aviso
exports.createAviso = async (req, res) => {
  try {
    const { assunto, mensagem, data, tipo } = req.body;
    const profissionalId = req.user.profissionalId; // Obtém do usuário autenticado

    // Validação básica
    if (!assunto || !mensagem || !data || !tipo) {
      return res.render('avisos/create', { 
        title: 'Novo Aviso', 
        error: 'Todos os campos são obrigatórios' 
      });
    }

    // Convertendo data para formato correto
    const dataFormatada = new Date(data);

    // Criar aviso no banco de dados
    await Aviso.create({ assunto, mensagem, data: dataFormatada, tipo, profissionalId });

    res.redirect('/avisos'); // Redireciona para a lista de avisos
  } catch (error) {
    console.error('Erro ao criar aviso:', error);
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
    const avisos = await Aviso.findAll();
    res.render('avisos/index', { title: 'Lista de Avisos', avisos });
  } catch (error) {
    console.error('Erro ao buscar avisos:', error);
    res.render('avisos/index', { 
      title: 'Lista de Avisos', 
      avisos: [], // Evita erro na view caso não haja dados
      error: 'Erro ao buscar avisos', 
      details: error.message 
    });
  }
};

exports.getAvisosDoDia = async (req, res) => {
  try {
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

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
          [Op.between]: [startOfDay, endOfDay], // Busca avisos dentro do intervalo do dia
        }
      },
      include: [
        {
          model: Profissional,
          as: 'profissional',
          attributes: ['id', 'nome', 'cargo']
        }
      ]
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

    // Convertendo data para formato correto

    await aviso.update({ assunto, mensagem, data, tipo });
    
    req.flash('success_msg', 'Aviso atualizado com sucesso.');
    console.log('Aviso atualizado com sucesso');
    res.redirect('/avisos'  ); // Redireciona para a lista de avisos
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

exports.contarAvisosDoDia = async (req, res) => {
  try {
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const avisosDoDia = await Aviso.count({
      where: {
        data: {
          [Op.between]: [startOfDay, endOfDay], // Filtra avisos dentro do dia atual
        }
      }
    });

    return res.json({ avisosDoDia });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao contar avisos do dia.' });
  }
};
