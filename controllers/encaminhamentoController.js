const Encaminhamento = require('../models/Encaminhamento');
const Notificacao = require('../models/Notificacao');
const Profissional = require('../models/Profissional');
const Atendimento = require('../models/Atendimento');
const { Op } = require('sequelize');  // Não se esqueça de importar o operador

const moment = require('moment');


exports.index = async (req, res) => {
  try {
    const { nomePaciente, profissional, data } = req.query;

    const whereConditions = {};
    
    if (nomePaciente) {
      whereConditions.nomePaciente = { [Op.like]: `%${nomePaciente}%` };
    }
    
    if (profissional) {
      whereConditions[Op.or] = [
        { '$profissionalEnvio.nome$': { [Op.like]: `%${profissional}%` } },
        { '$profissionalRecebido.nome$': { [Op.like]: `%${profissional}%` } }
      ];
    }

    if (data) {
      whereConditions.data = data;
    }


    const encaminhamentos = await Encaminhamento.findAll({
      where: whereConditions,
      include: [
        { model: Profissional, as: 'profissionalEnvio' },
        { model: Profissional, as: 'profissionalRecebido' },
        { model: Atendimento, as: 'atendimento', include: [
          { model: Profissional, as: 'profissional' }
        ]}, 
      ],
    });

    res.render('encaminhamentos/index', { encaminhamentos, query: req.query });
    
  } catch (error) {
    console.error('Erro ao buscar encaminhamentos:', error);
    res.status(500).send('Erro ao carregar a lista de encaminhamentos');
  }
};


exports.marcarVisto = async (req, res) => {
  const { id } = req.params;

  try {
    const encaminhamento = await Encaminhamento.findByPk(id);

    if (!encaminhamento) {
      req.flash('error', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    encaminhamento.visto = true;
    await encaminhamento.save();

    req.flash('success', 'Encaminhamento marcado como visto com sucesso!');
    res.redirect('/encaminhamentos');
  } catch (error) {
    console.error('Erro ao marcar encaminhamento como visto:', error);
    req.flash('error', 'Erro ao marcar o encaminhamento como visto.');
    res.redirect('/encaminhamentos');
  }
};


exports.create = async (req, res) => {
  try {
    // Obtém o ID do profissional que está logado
    const profissionalIdEnvio = req.user ? req.user.profissionalId : null;

    // Buscar profissionais psicólogos (para "Acolhimento de disparo")
    const profissionaisPsicologia = await Profissional.findAll({
      where: {
        id: { [Op.ne]: profissionalIdEnvio },
        cargo: "Psicólogo", // Filtra pelo cargo
      },
    });

    // Buscar profissionais assistentes sociais (para outros assuntos)
    const profissionaisServicoSocial = await Profissional.findAll({
      where: {
        id: { [Op.ne]: profissionalIdEnvio },
        cargo: "Assistente Social", // Filtra pelo cargo
      },
    });

    // Renderiza a view passando os dados
    res.render("encaminhamentos/create", {
      profissionalIdEnvio,
      profissionaisPsicologia,
      profissionaisServicoSocial,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao carregar os dados para o formulário.");
  }
};




exports.store = async (req, res) => {
  try {
    const {
      nomePaciente,
      matriculaPaciente,
      numeroProcesso,
      telefonePaciente,
      nomeProfissional,
      assuntoAcolhimento,
      descricao,
      profissionalIdEnvio,
      profissionalIdRecebido,
      atendimentoId,
    } = req.body;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Define o início do dia

    // Verifica se já existe um encaminhamento para este paciente e profissional na data atual
    const encaminhamentoExistente = await Encaminhamento.findOne({
      where: {
        matriculaPaciente, // Verifica pelo número de matrícula
        profissionalIdRecebido, // Mesmo profissional
        data: {
          [Op.gte]: hoje, // Data maior ou igual ao início do dia
        },
      },
    });

    if (encaminhamentoExistente) {
      req.flash('error_msg', 'Este paciente já foi encaminhado para este profissional hoje.');
      return res.redirect('/encaminhamentos/create');
    }

    const telefonePacienteLimpo = telefonePaciente.replace(/\D/g, ''); 


    // Criar novo encaminhamento
    const novoEncaminhamento = await Encaminhamento.create({
      nomePaciente,
      matriculaPaciente,
      numeroProcesso,
      telefonePaciente: telefonePacienteLimpo, // Salvando sem formatação
      nomeProfissional,
      assuntoAcolhimento,
      descricao,
      profissionalIdEnvio,
      profissionalIdRecebido,
      atendimentoId,
      data: new Date(),
    });

    // Notificar o profissional que recebeu o encaminhamento
    const profissionalRecebido = await Profissional.findByPk(profissionalIdRecebido);
    if (profissionalRecebido) {
      await Notificacao.create({
        titulo: `Novo Encaminhamento: ${assuntoAcolhimento}`,
        mensagem: `Você recebeu um novo encaminhamento referente ao paciente ${nomePaciente}.`,
        profissionalId: profissionalIdRecebido,
      });
      console.log('Notificação gerada com sucesso');
    }

    req.flash('success_msg', 'Encaminhamento criado com sucesso!');
    res.redirect('/encaminhamentos');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Erro ao criar encaminhamento.');
    res.status(500).redirect('/encaminhamentos/create');
  }
};



exports.detalhesEncaminhamento = async (req, res) => {
  try {
    const { id } = req.params;

    // Busca o encaminhamento pelo ID, incluindo os profissionais e o atendimento
    const encaminhamento = await Encaminhamento.findByPk(id, {
      include: [
        { model: Profissional, as: 'profissionalEnvio' },
        { model: Profissional, as: 'profissionalRecebido' },
        { model: Atendimento, as: 'atendimento' },
      ],
    });

    if (!encaminhamento) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    // Renderiza a view de detalhes com os dados do encaminhamento
    res.render('encaminhamentos/detalhes', { encaminhamento });
  } catch (error) {
    console.error('Erro ao buscar detalhes do encaminhamento:', error);
    req.flash('error_msg', 'Erro ao carregar detalhes do encaminhamento.');
    res.status(500).redirect('/encaminhamentos');
  }
};

exports.edit = async (req, res) => {
  const { id } = req.params;
  try {
    // Buscar o encaminhamento pelo ID
    const encaminhamento = await Encaminhamento.findByPk(id, {
      include: [
        { model: Profissional, as: 'profissionalEnvio' },
        { model: Profissional, as: 'profissionalRecebido' },
        { model: Atendimento, as: 'atendimento' },
      ],
    });

    // Verifica se o encaminhamento existe
    if (!encaminhamento) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    // Supondo que o id do profissional esteja armazenado na sessão (req.user)
    const profissionalIdEnvio = req.user ? req.user.id : null; // Verifica se o usuário está logado

    // Buscar todos os profissionais, excluindo o que está realizando o encaminhamento (profissionalIdEnvio)
    const profissionaisRecebimento = await Profissional.findAll({
      where: {
        id: {
          [Op.ne]: profissionalIdEnvio,  // Exclui o profissional que está realizando o encaminhamento
        },
      },
    });

    // Renderiza o formulário de edição, passando o encaminhamento e a lista de profissionaisRecebimento
    res.render('encaminhamentos/edit', { 
      encaminhamento: encaminhamento.get({ plain: true }),
      profissionalIdEnvio, 
      profissionaisRecebimento 
    });

  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro ao carregar encaminhamento para edição.');
    res.status(500).redirect('/encaminhamentos');
  }
};


exports.update = async (req, res) => {
  const { id } = req.params;

  try {
    const [updated] = await Encaminhamento.update(req.body, { where: { id } });

    if (!updated) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    req.flash('success_msg', 'Encaminhamento atualizado com sucesso!');
    res.redirect('/encaminhamentos');
  } catch (error) {
    console.error('Erro ao atualizar encaminhamento:', error);
    req.flash('error_msg', 'Erro ao atualizar encaminhamento.');
    res.status(500).redirect('/encaminhamentos');
  }
};

exports.destroy = async (req, res) => {
  const { id } = req.params;
  try {
    // Buscar o encaminhamento antes de deletar
    const encaminhamento = await Encaminhamento.findByPk(id);

    if (!encaminhamento) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    const { profissionalIdRecebido, assuntoAcolhimento, nomePaciente } = encaminhamento;

    // Deletar encaminhamento
    await Encaminhamento.destroy({ where: { id } });

    // Criar notificação para o profissional que receberia o encaminhamento
    if (profissionalIdRecebido) {
      await Notificacao.create({
        titulo: `Encaminhamento Cancelado: ${assuntoAcolhimento}`,
        mensagem: `O encaminhamento do paciente ${nomePaciente} foi cancelado.`,
        profissionalId: profissionalIdRecebido,
      });
      console.log('Notificação de cancelamento gerada com sucesso');
    }

    req.flash('success_msg', 'Encaminhamento cancelado com sucesso!');
    res.redirect('/encaminhamentos');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro ao cancelar encaminhamento.');
    res.status(500).redirect('/encaminhamentos');
  }
};


