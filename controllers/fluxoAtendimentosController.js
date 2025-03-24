const { FluxoAtendimentos, Profissional, Atendimento, Notificacao, Paciente, DiscussaoCaso, Usuario } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const index = async (req, res) => {
  try {
    const { nomePaciente, profissional, dataInicio, dataFim } = req.query;
    const profissionalId = req.user.profissionalId;

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

    if (dataInicio && dataFim) {
      whereConditions.data = { [Op.between]: [dataInicio, dataFim] };
    } else if (dataInicio) {
      whereConditions.data = { [Op.gte]: dataInicio };
    } else if (dataFim) {
      whereConditions.data = { [Op.lte]: dataFim };
    }

    // Se o usuário for administrador, não há restrição de cargo
    if (userCargo !== 'administrador') {
      // Restrições adicionais para Gestores, Assistentes Sociais, Psicólogos e Psiquiatras
      if (
        userCargo.includes('gestor') ||
        userCargo === 'assistente social' ||
        userCargo === 'psicólogo' ||
        userCargo === 'psiquiatra'
      ) {
        const cargosPermitidos = [];

        // Adiciona o próprio cargo do usuário
        cargosPermitidos.push(userCargo);

        // Adiciona os cargos gerenciados ou do gestor correspondente
        if (userCargo.includes('servico social')) {
          cargosPermitidos.push('assistente social');
        } else if (userCargo.includes('psicologia')) {
          cargosPermitidos.push('psicólogo');
        } else if (userCargo.includes('psiquiatria')) {
          cargosPermitidos.push('psiquiatra');
        }

        // Se for assistente social, psicólogo ou psiquiatra, adiciona o cargo do gestor correspondente
        if (userCargo === 'assistente social') {
          cargosPermitidos.push('gestor servico social');
        } else if (userCargo === 'psicólogo') {
          cargosPermitidos.push('gestor psicologia');
        } else if (userCargo === 'psiquiatra') {
          cargosPermitidos.push('gestor psiquiatria');
        }

        whereConditions[Op.or] = [
          { '$profissionalEnvio.cargo$': { [Op.in]: cargosPermitidos } },
          { '$profissionalRecebido.cargo$': { [Op.in]: cargosPermitidos } }
        ];
      }
    }

    // Buscar os fluxos de atendimentos com os relacionamentos necessários
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

    const fluxoAtendimentosFormatados = fluxoAtendimentos.map(enc => ({
      ...enc.toJSON(),
      podeEditar: userCargo === 'administrador' || enc.profissionalEnvio?.id === profissionalId,
      podeCancelar: userCargo === 'administrador' || enc.profissionalEnvio?.id === profissionalId,
      podeMarcarComoVisto: userCargo === 'administrador' || enc.profissionalRecebido?.id === profissionalId,
    }));

    res.render('fluxoAtendimentos/index', { 
      fluxoAtendimentos: fluxoAtendimentosFormatados || [], // Garante que nunca será undefined
      query: req.query,
      profissional: profissionalId,
      podeCancelar: fluxoAtendimentosFormatados.some(enc => enc.podeCancelar),
      podeMarcarComoVisto: fluxoAtendimentosFormatados.some(enc => enc.podeMarcarComoVisto),
      podeEditar: fluxoAtendimentosFormatados.some(enc => enc.podeEditar)
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


    const profissionaisServicoSocial = await Profissional.findAll({
      where: {
        id: { [Op.ne]: profissionalIdEnvio },
        cargo: "Assistente Social", 
      },
    });

    const profissionaisGestorSocial = await Profissional.findAll({
      where: {
        id: { [Op.ne]: profissionalIdEnvio },
        cargo: "Gestor Servico Social", 
      },
    });


    const pacientes = await Paciente.findAll({
      attributes: ['id', 'nome', 'matricula'], 
      order: [['nome', 'ASC']]
    });

    res.render("fluxoAtendimentos/create", {
      profissionalIdEnvio,
      profissionaisServicoSocial,
      profissionaisGestorSocial,
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
        {
          model: DiscussaoCaso, // Inclua as discussões de caso
          as: 'discussoes',
          include: [
            {
              model: Profissional,
              as: 'profissional',
              attributes: ['id', 'nome'], // Inclua apenas o ID e o nome do profissional
            },
          ],
        },
      ],
    });

    if (!fluxoAtendimento) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/fluxoAtendimentos');
    }

    res.render('fluxoAtendimentos/detalhes', { 
      fluxoAtendimento,
      discussoes: fluxoAtendimento.discussoes || [], // Passa as discussões para a view
    });
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


const criarDiscussaoCaso = async (req, res) => {
  try {
    const { fluxoAtendimentoId } = req.params;
    const { conteudo } = req.body;

    if (!conteudo) {
      req.flash('error_msg', 'Conteúdo é obrigatório.');
      return res.redirect(`/fluxoAtendimentos/${fluxoAtendimentoId}`);
    }

    const fluxoAtendimento = await FluxoAtendimentos.findByPk(fluxoAtendimentoId);
    if (!fluxoAtendimento) {
      req.flash('error_msg', 'Fluxo de atendimento não encontrado.');
      return res.redirect('/fluxoAtendimentos');
    }

    if (!req.user || !req.user.id) {
      req.flash('error_msg', 'Você precisa estar logado para criar uma discussão.');
      return res.redirect('/auth/login');
    }

    const usuario = await Usuario.findOne({
      where: { id: req.user.id },
      include: { model: Profissional, as: 'profissional' },
    });

    if (!usuario || !usuario.profissional) {
      req.flash('error_msg', 'Você precisa ter um profissional associado para criar uma discussão.');
      return res.redirect('/fluxoAtendimentos');
    }

    const autor = usuario.profissional.id;

    await DiscussaoCaso.create({
      conteudo,
      autor,
      fluxoAtendimentoId,
    });

    req.flash('success_msg', 'Discussão de caso criada com sucesso.');
    res.redirect(`/fluxoAtendimentos/${fluxoAtendimentoId}`);
  } catch (error) {
    console.error('Erro ao criar discussão de caso:', error);
    req.flash('error_msg', 'Erro ao criar discussão de caso.');
    res.redirect('/fluxoAtendimentos/index');
  }
};

const listarDiscussaoCasos = async (req, res) => {
  try {
    const { fluxoAtendimentoId } = req.params;

    const discussoes = await DiscussaoCaso.findAll({
      where: { fluxoAtendimentoId },
      include: [
        { model: Profissional, as: 'profissional' },
      ],
    });

    res.status(200).json(discussoes);
  } catch (error) {
    console.error('Erro ao listar discussões de caso:', error);
    res.status(500).json({ error: 'Erro interno ao listar discussões de caso.' });
  }
};




const deletarDiscussaoCaso = async (req, res) => {
  try {
    const { fluxoAtendimentoId, discussaoId } = req.params;

    // Verifica se o fluxo de atendimento existe
    const fluxoAtendimento = await FluxoAtendimentos.findByPk(fluxoAtendimentoId);
    if (!fluxoAtendimento) {
      req.flash('error_msg', 'Fluxo de atendimento não encontrado.');
      return res.redirect('/fluxoAtendimentos');
    }

    // Verifica se a discussão de caso existe
    const discussaoCaso = await DiscussaoCaso.findOne({
      where: { id: discussaoId, fluxoAtendimentoId },
    });

    if (!discussaoCaso) {
      req.flash('error_msg', 'Discussão de caso não encontrada.');
      return res.redirect(`/fluxoAtendimentos/${fluxoAtendimentoId}`);
    }

    // Verifica se o usuário tem permissão para deletar a discussão
    if (!req.user || !req.user.id) {
      req.flash('error_msg', 'Você precisa estar logado para deletar uma discussão.');
      return res.redirect('/auth/login');
    }

    const usuario = await Usuario.findOne({
      where: { id: req.user.id },
      include: { model: Profissional, as: 'profissional' },
    });

    if (!usuario || !usuario.profissional) {
      req.flash('error_msg', 'Você precisa ter um profissional associado para deletar uma discussão.');
      return res.redirect('/fluxoAtendimentos');
    }

    // Verifica se o usuário é o autor da discussão ou tem permissão de administrador
    if (discussaoCaso.autor !== usuario.profissional.id && usuario.cargo !== 'administrador') {
      req.flash('error_msg', 'Você não tem permissão para deletar esta discussão.');
      return res.redirect(`/fluxoAtendimentos/${fluxoAtendimentoId}`);
    }

    // Deleta a discussão de caso
    await discussaoCaso.destroy();

    req.flash('success_msg', 'Discussão de caso deletada com sucesso.');
    res.redirect(`/fluxoAtendimentos/${fluxoAtendimentoId}`);
  } catch (error) {
    console.error('Erro ao deletar discussão de caso:', error);
    req.flash('error_msg', 'Erro ao deletar discussão de caso.');
    res.redirect(`/fluxoAtendimentos/${fluxoAtendimentoId}`);
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
  destroy,
  criarDiscussaoCaso,
  listarDiscussaoCasos,
  deletarDiscussaoCaso,
};