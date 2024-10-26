const Atendimento = require('../models/Atendimento');
const Paciente = require('../models/Paciente');
const Profissional = require('../models/Profissional');

exports.index = async (req, res) => {
  try {
    const atendimentos = await Atendimento.findAll({
      include: [
        { model: Paciente, as: 'paciente' },
        { model: Profissional, as: 'profissional' }
      ]
    });
    res.render('atendimentos/index', { atendimentos });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao listar atendimentos');
  }
};

exports.create = async (req, res) => {
  try {
    const pacientes = await Paciente.findAll();
    const profissionais = await Profissional.findAll(); 
    res.render('atendimentos/create', { pacientes, profissionais });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar a página de criação de atendimento');
  }
};

exports.store = async (req, res) => {
  try {
    const profissionalId = req.user?.profissional?.id; 
    if (!profissionalId) {
      return res.status(403).send('Acesso negado. Profissional não autenticado.');
    }

    await Atendimento.create({
      matriculaPaciente: req.body.matriculaPaciente,
      numeroProcesso: req.body.numeroProcesso,
      assunto: req.body.assunto,
      registroAtendimento: req.body.registroAtendimento,
      acolhidoEm: req.body.acolhidoEm,
      profissionalId 
    });

    res.redirect('/atendimentos'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao criar o atendimento');
  }
};

exports.edit = async (req, res) => {
  try {
    const atendimento = await Atendimento.findByPk(req.params.id, {
      include: [{ model: Paciente, as: 'paciente' }]
    });
    const pacientes = await Paciente.findAll();
    const profissionalId = req.user?.profissional?.id; 
    res.render('atendimentos/edit', { atendimento, pacientes, profissionalId });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar a página de edição de atendimento');
  }
};

exports.update = async (req, res) => {
  try {
    const atendimento = await Atendimento.findByPk(req.params.id);
    const profissionalId = req.user?.profissional?.id; 
    if (!profissionalId) {
      return res.status(403).send('Acesso negado. Profissional não autenticado.');
    }

    await atendimento.update({
      matriculaPaciente: req.body.matriculaPaciente,
      numeroProcesso: req.body.numeroProcesso,
      assunto: req.body.assunto,
      registroAtendimento: req.body.registroAtendimento,
      acolhidoEm: req.body.acolhidoEm,
      profissionalId 
    });

    res.redirect('/atendimentos'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar o atendimento');
  }
};

exports.destroy = async (req, res) => {
  try {
    await Atendimento.destroy({ where: { id: req.params.id } });
    res.redirect('/atendimentos');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao deletar atendimento');
  }
};
