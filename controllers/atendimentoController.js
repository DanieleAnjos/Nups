const Atendimento = require('../models/Atendimento');
const Paciente = require('../models/Paciente');
const Profissional = require('../models/Profissional');

// Lista de atendimentos
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

// Criar novo atendimento - GET
exports.create = async (req, res) => {
  try {
    const pacientes = await Paciente.findAll();
    const profissionais = await Profissional.findAll(); // Incluindo todos os profissionais disponíveis
    res.render('atendimentos/create', { pacientes, profissionais });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar a página de criação de atendimento');
  }
};

// Armazenar novo atendimento - POST
exports.store = async (req, res) => {
  try {
    const profissionalId = req.user?.profissional?.id; // Verifica se o profissional está no req.user
    if (!profissionalId) {
      return res.status(403).send('Acesso negado. Profissional não autenticado.');
    }

    await Atendimento.create({
      matriculaPaciente: req.body.matriculaPaciente,
      numeroProcesso: req.body.numeroProcesso,
      assunto: req.body.assunto,
      registroAtendimento: req.body.registroAtendimento,
      acolhidoEm: req.body.acolhidoEm,
      profissionalId // Captura o ID do profissional logado
    });

    res.redirect('/atendimentos'); // Redireciona para a lista de atendimentos
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao criar o atendimento');
  }
};

// Editar atendimento - GET
exports.edit = async (req, res) => {
  try {
    const atendimento = await Atendimento.findByPk(req.params.id, {
      include: [{ model: Paciente, as: 'paciente' }]
    });
    const pacientes = await Paciente.findAll();
    const profissionalId = req.user?.profissional?.id; // Verifica se o profissional está no req.user
    res.render('atendimentos/edit', { atendimento, pacientes, profissionalId });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar a página de edição de atendimento');
  }
};

// Atualizar atendimento - PUT
exports.update = async (req, res) => {
  try {
    const atendimento = await Atendimento.findByPk(req.params.id);
    const profissionalId = req.user?.profissional?.id; // Verifica se o profissional está no req.user
    if (!profissionalId) {
      return res.status(403).send('Acesso negado. Profissional não autenticado.');
    }

    await atendimento.update({
      matriculaPaciente: req.body.matriculaPaciente,
      numeroProcesso: req.body.numeroProcesso,
      assunto: req.body.assunto,
      registroAtendimento: req.body.registroAtendimento,
      acolhidoEm: req.body.acolhidoEm,
      profissionalId // Captura o ID do profissional logado
    });

    res.redirect('/atendimentos'); // Redireciona para a lista de atendimentos
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar o atendimento');
  }
};

// Deletar atendimento - DELETE
exports.destroy = async (req, res) => {
  try {
    await Atendimento.destroy({ where: { id: req.params.id } });
    res.redirect('/atendimentos');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao deletar atendimento');
  }
};
