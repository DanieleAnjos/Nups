const Encaminhamento = require('../models/Encaminhamento');
const Notificacao = require('../models/Notificacao');  


exports.index = async (req, res) => {
  try {
    const encaminhamentos = await Encaminhamento.findAll();
    res.render('encaminhamentos/index', { encaminhamentos });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar a lista de encaminhamentos');
  }
};

exports.marcarVisualizado = async (req, res) => {
  const { id } = req.params;

  try {

    const encaminhamento = await Encaminhamento.findByPk(id);

    if (!encaminhamento) {
      req.flash('error', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    encaminhamento.visualizado = true;
    await encaminhamento.save();

    req.flash('success', 'Encaminhamento marcado como visualizado com sucesso!');
    res.redirect('/encaminhamentos');
  } catch (error) {
    console.error('Erro ao marcar encaminhamento como visualizado:', error);
    
    req.flash('error', 'Erro ao marcar o encaminhamento como visualizado.');
    res.redirect('/encaminhamentos');
  }
};




exports.create = (req, res) => {
  res.render('encaminhamentos/create'); 
};

exports.store = async (req, res) => {
  try {
    const { nomePaciente, matriculaPaciente, nomeProfissional, profissaoProfissional, assuntoAcolhimento, descricao } = req.body;

    const novoEncaminhamento = await Encaminhamento.create({
      nomePaciente,
      matriculaPaciente,
      nomeProfissional,
      profissaoProfissional,
      assuntoAcolhimento,
      descricao,
    });

    const profissional = await Profissional.findOne({ where: { nome: nomeProfissional } });

    if (profissional) {
      const notificar = await Notificacao.create({
        titulo: `Novo Encaminhamento: ${assuntoAcolhimento}`,
        mensagem: `Você recebeu um novo encaminhamento referente ao paciente ${nomePaciente}.`,
        profissionalId: profissional.id,  // Associa a notificação ao profissional
      });
      console.log('Notificação gerada com sucesso');
    }

    res.redirect('/encaminhamentos'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao criar encaminhamento');
  }
};

exports.edit = async (req, res) => {
  const { id } = req.params;
  try {
    const encaminhamento = await Encaminhamento.findByPk(id);
    if (!encaminhamento) {
      return res.status(404).send('Encaminhamento não encontrado');
    }
    res.render('encaminhamentos/edit', { encaminhamento });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar encaminhamento para edição');
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await Encaminhamento.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).send('Encaminhamento não encontrado');
    }
    res.redirect('/encaminhamentos'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar encaminhamento');
  }
};

exports.destroy = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Encaminhamento.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).send('Encaminhamento não encontrado');
    }
    res.redirect('/encaminhamentos'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao deletar encaminhamento');
  }
};
