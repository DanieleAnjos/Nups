const Aviso = require('../models/Aviso');
const Profissional = require('../models/Profissional');
const { Op } = require('sequelize');
const moment = require('moment-timezone');

function getCargosPermitidos(cargoUsuario) {
  const cargos = ['Assistente social', 'Psicólogo', 'Psiquiatra'];

  if (['Administrador', 'Adm'].includes(cargoUsuario)) {
    return ['Geral', ...cargos];
  } else if (cargoUsuario.startsWith('Gestor')) {
    return [cargoUsuario.replace('Gestor ', '')];
  }
  return [];
}

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
      cargosPermitidos,
      isGeralPermitido: cargosPermitidos.includes('Geral')
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de aviso:', error);
    res.render('avisos/create', { title: 'Novo Aviso', error: 'Erro ao carregar formulário' });
  }
};

exports.createAviso = async (req, res) => {
  try {
    const { assunto, mensagem, data, tipo, cargoAlvo } = req.body;
    if (!assunto || !mensagem || !data || !tipo) {
      return res.render('avisos/create', { title: 'Novo Aviso', error: 'Todos os campos são obrigatórios' });
    }

    const profissional = await Profissional.findByPk(req.user.profissionalId, { attributes: ['cargo'] });
    if (!profissional) return res.status(404).json({ message: 'Profissional não encontrado.' });

    if (cargoAlvo && !getCargosPermitidos(profissional.cargo).includes(cargoAlvo)) {
      return res.render('avisos/create', { title: 'Novo Aviso', error: 'Cargo alvo não permitido.' });
    }

    await Aviso.create({
      assunto,
      mensagem,
      data: moment.tz(data, 'America/Sao_Paulo').toDate(),
      tipo,
      cargoAlvo,
      profissionalId: req.user.profissionalId
    });

    req.flash('success_msg', 'Aviso criado com sucesso');
    res.redirect('/avisos');
  } catch (error) {
    console.error('Erro ao criar aviso:', error);
    res.render('avisos/create', { title: 'Novo Aviso', error: 'Erro ao criar aviso' });
  }
};

exports.getAllAvisos = async (req, res) => {
  try {
    const { nomeProfissional, dataInicio } = req.query;
    const whereConditions = {};

    if (nomeProfissional) {
      whereConditions['$profissional.nome$'] = { [Op.like]: `%${nomeProfissional}%` };
    }

    if (dataInicio) {
      whereConditions.data = { [Op.eq]: moment.tz(dataInicio, 'America/Sao_Paulo').startOf('day').toDate() };
    }

    const avisos = await Aviso.findAll({
      where: whereConditions,
      include: [{ model: Profissional, as: 'profissional', attributes: ['id', 'nome', 'cargo'] }],
      order: [['data', 'DESC']]
    });

    res.render('avisos/index', { title: 'Lista de Avisos', avisos, query: req.query });
  } catch (error) {
    console.error('Erro ao buscar avisos:', error);
    res.render('avisos/index', { title: 'Lista de Avisos', avisos: [], error: 'Erro ao buscar avisos' });
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

exports.updateAviso = async (req, res) => {
  try {
    const { id } = req.params;
    const { assunto, mensagem, data, tipo, cargoAlvo } = req.body;

    const aviso = await Aviso.findByPk(id);
    if (!aviso) return res.render('avisos/index', { title: 'Lista de Avisos', error: 'Aviso não encontrado' });

    const profissional = await Profissional.findByPk(req.user.profissionalId, { attributes: ['cargo'] });
    if (!profissional) return res.status(404).json({ message: 'Profissional não encontrado.' });

    if (cargoAlvo && !getCargosPermitidos(profissional.cargo).includes(cargoAlvo)) {
      return res.render('avisos/edit', { title: 'Editar Aviso', error: 'Cargo alvo não permitido.' });
    }

    await aviso.update({
      assunto,
      mensagem,
      data: moment.tz(data, 'America/Sao_Paulo').toDate(),
      tipo,
      cargoAlvo
    });

    req.flash('success_msg', 'Aviso atualizado com sucesso');
    res.redirect('/avisos');
  } catch (error) {
    console.error('Erro ao atualizar aviso:', error);
    res.render('avisos/edit', { title: 'Editar Aviso', error: 'Erro ao atualizar aviso' });
  }
};

exports.deleteAviso = async (req, res) => {
  try {
    const { id } = req.params;
    const aviso = await Aviso.findByPk(id);
    if (!aviso) return res.render('avisos/index', { title: 'Lista de Avisos', error: 'Aviso não encontrado' });

    await aviso.destroy();
    req.flash('success_msg', 'Aviso deletado');
    res.redirect('/avisos');
  } catch (error) {
    console.error('Erro ao excluir aviso:', error);
    res.render('avisos/index', { title: 'Lista de Avisos', error: 'Erro ao excluir aviso' });
  }
};

exports.contarAvisosDoDia = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.user.profissionalId, { attributes: ['cargo'] });
    if (!profissional) return res.status(404).json({ error: 'Profissional não encontrado.' });

    const startOfDay = moment().tz('America/Sao_Paulo').startOf('day').toDate();
    const endOfDay = moment().tz('America/Sao_Paulo').endOf('day').toDate();

    const avisosDoDia = await Aviso.count({
      where: {
        data: { [Op.between]: [startOfDay, endOfDay] },
        [Op.or]: [{ cargoAlvo: 'Geral' }, { cargoAlvo: profissional.cargo }]
      }
    });

    res.json({ avisosDoDia });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao contar avisos do dia.' });
  }
};
