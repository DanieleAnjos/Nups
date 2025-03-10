const { FluxoAtendimentos, Profissional, Atendimento, Notificacao, Paciente } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const index = async (req, res) => {
  try {
    const { nomePaciente, profissional, data } = req.query;
    const profissionalId = req.user.profissionalId;

    // Buscar o profissional associado ao usuário logado
    const profissionalAssociado = await Profissional.findOne({
      where: { id: profissionalId },
    });

    if (!profissionalAssociado) {
      return res.status(403).send('Usuário não está associado a um profissional válido.');
    }

    const userCargo = profissionalAssociado.cargo ? profissionalAssociado.cargo.toLowerCase() : '';

    // Definir filtros
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

    // Buscar os atendimentos com os relacionamentos necessários
    const fluxoAtendimentos = await FluxoAtendimentos.findAll({
      where: whereConditions,
      include: [
        { model: Profissional, as: 'profissionalEnvio' },
        { model: Profissional, as: 'profissionalRecebido' },
        { 
          model: Atendimento, 
          as: 'atendimento',
          include: [{ model: Profissional, as: 'profissional' }]
        },
      ],
    });

    // Mapear os fluxos de atendimento e adicionar permissões individuais
    const fluxoAtendimentosFormatados = fluxoAtendimentos.map(fa => ({
      ...fa.toJSON(),
      podeEditar: userCargo === 'administrador' || (fa.profissionalEnvio?.id === profissionalId && !fa.visto),
    }));

    // Definir permissões gerais
    const podeDeletar = userCargo === 'administrador';
    const podeCadastrar = userCargo === 'administrador' || userCargo === 'assistente social';

    // Renderizar a página com os dados e permissões
    res.render('fluxoAtendimentos/index', { 
      fluxoAtendimentos: fluxoAtendimentosFormatados, 
      query: req.query,
      profissional: profissionalId,
      podeDeletar,
      podeCadastrar
    });

  } catch (error) {
    console.error('Erro ao buscar fluxo de atendimentos:', error);
    res.status(500).send('Erro ao carregar a lista de fluxo de atendimentos');
  }
};


const marcarVisto = async (req, res) => {
  const { id } = req.params;

  try {
    const fluxoAtendimento = await FluxoAtendimentos.findByPk(id);

    if (!fluxoAtendimento) {
      req.flash('error', 'Encaminhamento não encontrado.');
      return res.redirect('/fluxoAtendimentos');
    }

    fluxoAtendimento.visto = true;
    await fluxoAtendimento.save();

    req.flash('success', 'Encaminhamento marcado como visto com sucesso!');
    res.redirect('/fluxoAtendimentos');
  } catch (error) {
    console.error('Erro ao marcar encaminhamento como visto:', error);
    req.flash('error', 'Erro ao marcar o encaminhamento como visto.');
    res.redirect('/fluxoAtendimentos');
  }
};

const create = async (req, res) => {
  try {
    const profissionalIdEnvio = req.user ? req.user.profissionalId : null;

    const profissionaisPsicologia = await Profissional.findAll({
      where: {
        id: { [Op.ne]: profissionalIdEnvio },
        cargo: "Psicólogo", 
      },
    });

    const profissionaisServicoSocial = await Profissional.findAll({
      where: {
        id: { [Op.ne]: profissionalIdEnvio },
        cargo: "Assistente Social", 
      },
    });

    const pacientes = await Paciente.findAll({
      attributes: ['id', 'nome', 'matricula'], 
      order: [['nome', 'ASC']]
    });

    res.render("fluxoAtendimentos/create", {
      profissionalIdEnvio,
      profissionaisPsicologia,
      profissionaisServicoSocial,
      pacientes,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao carregar os dados para o formulário.");
  }
};


const store = async (req, res) => {
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
    hoje.setHours(0, 0, 0, 0);

    const fluxoAtendimentoExistente = await FluxoAtendimentos.findOne({
      where: {
        matriculaPaciente,
        profissionalIdRecebido,
        data: { [Op.gte]: hoje },
      },
    });

    if (fluxoAtendimentoExistente) {
      req.flash('error_msg', 'Este paciente já foi encaminhado para este profissional hoje.');
      return res.redirect('/fluxoAtendimentos/create');
    }

    const telefonePacienteLimpo = telefonePaciente.replace(/\D/g, '');

    const novoFluxoAtendimento = await FluxoAtendimentos.create({
      nomePaciente,
      matriculaPaciente,
      numeroProcesso,
      telefonePaciente: telefonePacienteLimpo,
      nomeProfissional,
      assuntoAcolhimento,
      descricao,
      profissionalIdEnvio,
      profissionalIdRecebido,
      atendimentoId,
      data: new Date(),
    });

    const profissionalRecebido = await Profissional.findByPk(profissionalIdRecebido);
    if (profissionalRecebido) {
      await Notificacao.create({
        titulo: `Novo Encaminhamento: ${assuntoAcolhimento}`,
        mensagem: `Você recebeu um novo encaminhamento referente ao paciente ${nomePaciente}.`,
        profissionalId: profissionalIdRecebido,
      });
    }

    req.flash('success_msg', 'Encaminhamento criado com sucesso!');
    res.redirect('/fluxoAtendimentos');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Erro ao criar encaminhamento.');
    res.status(500).redirect('/fluxoAtendimentos/create');
  }
};

const detalhesEncaminhamento = async (req, res) => {
  try {
    const { id } = req.params;

    const fluxoAtendimento = await FluxoAtendimentos.findByPk(id, {
      include: [
        { model: Profissional, as: 'profissionalEnvio' },
        { model: Profissional, as: 'profissionalRecebido' },
        { model: Atendimento, as: 'atendimento' },
      ],
    });

    if (!fluxoAtendimento) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/fluxoAtendimentos');
    }

    res.render('fluxoAtendimentos/detalhes', { fluxoAtendimento });
  } catch (error) {
    console.error('Erro ao buscar detalhes do encaminhamento:', error);
    req.flash('error_msg', 'Erro ao carregar detalhes do encaminhamento.');
    res.status(500).redirect('/fluxoAtendimentos');
  }
};

const edit = async (req, res) => {
  const { id } = req.params;
  try {
    const fluxoAtendimentos = await FluxoAtendimentos.findByPk(id, {
      include: [
        { model: Profissional, as: 'profissionalEnvio' },
        { model: Profissional, as: 'profissionalRecebido' },
        { model: Atendimento, as: 'atendimento' },
      ],
    });

    if (!fluxoAtendimentos) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/fluxoAtendimentos');
    }

    const profissionalIdEnvio = req.user ? req.user.id : null; 

    const profissionaisRecebimento = await Profissional.findAll({
      where: {
        id: {
          [Op.ne]: profissionalIdEnvio,  
        },
      },
    });

    const pacientes = await Paciente.findAll({
      attributes: ['id', 'nome', 'matricula'],
      order: [['nome', 'ASC']]
    });

    res.render('fluxoAtendimentos/edit', { 
      fluxoAtendimentos: fluxoAtendimentos.get({ plain: true }),
      profissionalIdEnvio, 
      profissionaisRecebimento,
      pacientes
    });

  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro ao carregar encaminhamento para edição.');
    res.status(500).redirect('/fluxoAtendimentos');
  }
};

const update = async (req, res) => {
  const { id } = req.params;

  try {
    const [updated] = await FluxoAtendimentos.update(req.body, { where: { id } });

    if (!updated) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/fluxoAtendimentos');
    }

    req.flash('success_msg', 'Encaminhamento atualizado com sucesso!');
    res.redirect('/fluxoAtendimentos');
  } catch (error) {
    console.error('Erro ao atualizar encaminhamento:', error);
    req.flash('error_msg', 'Erro ao atualizar encaminhamento.');
    res.status(500).redirect('/fluxoAtendimentos');
  }
};

const destroy = async (req, res) => {
  const { id } = req.params;
  try {
    const fluxoAtendimento = await FluxoAtendimentos.findByPk(id);

    if (!fluxoAtendimento) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/fluxoAtendimentos');
    }

    const { profissionalIdRecebido, assuntoAcolhimento, nomePaciente } = fluxoAtendimento;

    await fluxoAtendimento.destroy();

    if (profissionalIdRecebido) {
      await Notificacao.create({
        titulo: `Encaminhamento Cancelado: ${assuntoAcolhimento}`,
        mensagem: `O encaminhamento do paciente ${nomePaciente} foi cancelado.`,
        profissionalId: profissionalIdRecebido,
      });
    }

    req.flash('success_msg', 'Encaminhamento cancelado com sucesso!');
    res.redirect('/fluxoAtendimentos');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro ao cancelar encaminhamento.');
    res.status(500).redirect('/fluxoAtendimentos');
  }
};

module.exports = {
  index,
  create,
  edit,
  store,
  detalhesEncaminhamento,
  marcarVisto,
  update,
  destroy
};