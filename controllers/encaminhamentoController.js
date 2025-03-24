const Encaminhamento = require('../models/Encaminhamento');
const Notificacao = require('../models/Notificacao');
const Profissional = require('../models/Profissional');
const Atendimento = require('../models/Atendimento');
const DiscussaoCaso = require('../models/DiscussaoCaso');
const Usuario = require('../models/Usuario');

const { Op } = require('sequelize');  
const moment = require('moment-timezone');
const { Paciente } = require('../models');

exports.index = async (req, res) => {
  try {
    const { nomePaciente, profissional, dataInicio, dataFim, mes, ano } = req.query;
    const profissionalId = req.user.profissionalId;

    const profissionalAssociado = await Profissional.findOne({
      where: { id: profissionalId },
    });

    if (!profissionalAssociado) {
      return res.status(403).send('Usuário não está associado a um profissional válido.');
    }

    const userCargo = profissionalAssociado.cargo ? profissionalAssociado.cargo.toLowerCase() : '';

    const whereConditions = {};

    // Filtro por nome do paciente
    if (nomePaciente) {
      whereConditions.nomePaciente = { [Op.like]: `%${nomePaciente}%` };
    }

    // Filtro por profissional
    if (profissional) {
      whereConditions[Op.or] = [
        { '$profissionalEnvio.nome$': { [Op.like]: `%${profissional}%` } },
        { '$profissionalRecebido.nome$': { [Op.like]: `%${profissional}%` } }
      ];
    }

    // Filtro por data
    if (dataInicio || dataFim) {
      whereConditions.data = {};
      if (dataInicio) {
        whereConditions.data[Op.gte] = dataInicio; // Data maior ou igual a dataInicio
      }
      if (dataFim) {
        whereConditions.data[Op.lte] = dataFim; // Data menor ou igual a dataFim
      }
    }

    // Filtro por mês e ano
    if (mes && ano) {
      const inicioMes = moment(`${ano}-${mes}-01`).startOf('month').format('YYYY-MM-DD');
      const fimMes = moment(`${ano}-${mes}-01`).endOf('month').format('YYYY-MM-DD');
      whereConditions.data = { [Op.between]: [inicioMes, fimMes] };
    }

    // Filtro por ano
    if (ano && !mes) {
      const inicioAno = moment(`${ano}-01-01`).startOf('year').format('YYYY-MM-DD');
      const fimAno = moment(`${ano}-12-31`).endOf('year').format('YYYY-MM-DD');
      whereConditions.data = { [Op.between]: [inicioAno, fimAno] };
    }


    const encaminhamentos = await Encaminhamento.findAll({
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
      order: [['createdAt', 'DESC']]
    });

    const encaminhamentosFormatados = encaminhamentos.map(enc => ({
      ...enc.toJSON(),
      podeEditar: userCargo === 'administrador' || enc.profissionalEnvio?.id === profissionalId,
      podeCancelar: userCargo === 'administrador' || enc.profissionalEnvio?.id === profissionalId,
      podeMarcarComoVisto: userCargo === 'administrador' || enc.profissionalRecebido?.id === profissionalId,
    }));

    res.render('encaminhamentos/index', { 
      encaminhamentos: encaminhamentosFormatados || [],
      query: req.query,
      profissional: profissionalId,
      podeCancelar: encaminhamentosFormatados.some(enc => enc.podeCancelar),
      podeMarcarComoVisto: encaminhamentosFormatados.some(enc => enc.podeMarcarComoVisto),
      podeEditar: encaminhamentosFormatados.some(enc => enc.podeEditar)
    });    

  } catch (error) {
    console.error('Erro ao buscar encaminhamentos:', error.message);
    res.render('encaminhamentos/index', {
      encaminhamentos: [],
      query: req.query,
      profissional: profissionalId,
      error_msg: 'Erro ao carregar os encaminhamentos.'
    });
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
    const profissionalIdEnvio = req.user ? req.user.profissionalId : null;

    const todosProfissionais = await Profissional.findAll({
      attributes: ['id', 'nome', 'cargo']
    });



        const pacientes = await Paciente.findAll({
          attributes: ['id', 'nome', 'matricula'], 
          order: [['nome', 'ASC']]
        });
    

    res.render("encaminhamentos/create", {
      profissionalIdEnvio,
      todosProfissionais,
      pacientes,
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
    hoje.setHours(0, 0, 0, 0); 

    // Verifica se já existe um encaminhamento com a mesma matrícula e o mesmo profissional
    const encaminhamentoExistente = await Encaminhamento.findOne({
      where: {
        matriculaPaciente, 
        profissionalIdRecebido, 
        data: {
          [Op.gte]: hoje, 
        },
      },
    });

    if (encaminhamentoExistente) {
      req.flash('error_msg', 'Este paciente já foi encaminhado para este profissional hoje.');
      return res.redirect('/encaminhamentos/create');
    }

    // Verifica se já existe um encaminhamento com o mesmo número de processo
    const numeroProcessoExistente = await Encaminhamento.findOne({
      where: {
        numeroProcesso,
      },
    });

    if (numeroProcessoExistente) {
      req.flash('error_msg', 'Este número de processo já está associado a um encaminhamento.');
      return res.redirect('/encaminhamentos/create');
    }

    const telefonePacienteLimpo = telefonePaciente.replace(/\D/g, ''); 

    // Cria o novo encaminhamento
    const novoEncaminhamento = await Encaminhamento.create({
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

    // Notificação para o profissional recebido
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

    const encaminhamento = await Encaminhamento.findByPk(id, {
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

    if (!encaminhamento) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    res.render('encaminhamentos/detalhes', { 
      encaminhamento,
      discussoes: encaminhamento.discussoes || [], 
      profissional: req.user.profissional,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do encaminhamento:', error);
    req.flash('error_msg', 'Erro ao carregar detalhes do encaminhamento.');
    res.status(500).redirect('/encaminhamentos');
  }
};

exports.edit = async (req, res) => {
  const { id } = req.params;
  try {
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

    const profissionalIdEnvio = req.user ? req.user.id : null; 

    const profissionaisRecebimento = await Profissional.findAll({
      where: {
        id: {
          [Op.ne]: profissionalIdEnvio,  
        },
      },
    });



    const todosProfissionais = await Profissional.findAll({
      attributes: ['id', 'nome', 'cargo']
    });

  

    const pacientes = await Paciente.findAll({
      attributes: ['id', 'nome', 'matricula'], 
      order: [['nome', 'ASC']]
    });


    res.render('encaminhamentos/edit', { 
      encaminhamento: encaminhamento.get({ plain: true }),
      profissionalIdEnvio, 
      profissionaisRecebimento,
      pacientes,
      todosProfissionais
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

    const startOfDay = moment.tz('America/Sao_Paulo').startOf('day').toDate();
    const endOfDay = moment.tz('America/Sao_Paulo').endOf('day').toDate();

    // Verifica se já existe um encaminhamento para o mesmo paciente e profissional no mesmo dia
    const encaminhamentoExistente = await Encaminhamento.findOne({
      where: {
        matriculaPaciente: matriculaPaciente,
        profissionalIdRecebido: profissionalIdRecebido,
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
        id: {
          [Op.ne]: id,
        },
      },
    });

    if (encaminhamentoExistente) {
      req.flash(
        'error_msg',
        'Este profissional já recebeu um encaminhamento para o mesmo paciente hoje.'
      );
      return res.redirect(`/encaminhamentos/${id}/edit`);
    }

    // Busca o encaminhamento atual antes de atualizar
    const encaminhamentoAtual = await Encaminhamento.findByPk(id);
    if (!encaminhamentoAtual) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    const [updated] = await Encaminhamento.update(req.body, { where: { id } });

    if (!updated) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    // Verifica se o profissional recebido foi alterado
    if (encaminhamentoAtual.profissionalIdRecebido !== profissionalIdRecebido) {
      // Notifica o profissional anterior sobre o cancelamento
      if (encaminhamentoAtual.profissionalIdRecebido) {
        await Notificacao.create({
          titulo: `Encaminhamento Cancelado: ${encaminhamentoAtual.assuntoAcolhimento}`,
          mensagem: `O encaminhamento do paciente ${encaminhamentoAtual.nomePaciente} foi cancelado.`,
          profissionalId: encaminhamentoAtual.profissionalIdRecebido,
        });
        console.log('Notificação de cancelamento gerada para o profissional anterior.');
      }

      // Notifica o novo profissional sobre o encaminhamento
      if (profissionalIdRecebido) {
        await Notificacao.create({
          titulo: `Novo Encaminhamento: ${assuntoAcolhimento}`,
          mensagem: `Você recebeu um novo encaminhamento para o paciente ${nomePaciente}.`,
          profissionalId: profissionalIdRecebido,
        });
        console.log('Notificação de novo encaminhamento gerada para o novo profissional.');
      }
    } else {

      if (
        encaminhamentoAtual.nomePaciente !== nomePaciente ||
        encaminhamentoAtual.matriculaPaciente !== matriculaPaciente ||
        encaminhamentoAtual.numeroProcesso !== numeroProcesso ||
        encaminhamentoAtual.telefonePaciente !== telefonePaciente ||
        encaminhamentoAtual.nomeProfissional !== nomeProfissional ||
        encaminhamentoAtual.assuntoAcolhimento !== assuntoAcolhimento ||
        encaminhamentoAtual.descricao !== descricao ||
        encaminhamentoAtual.profissionalIdEnvio !== profissionalIdEnvio ||
        encaminhamentoAtual.atendimentoId !== atendimentoId
      ) {
        // Notifica o profissional recebido sobre a atualização
        if (profissionalIdRecebido) {
          await Notificacao.create({
            titulo: `Encaminhamento Atualizado: ${assuntoAcolhimento}`,
            mensagem: `O encaminhamento do paciente ${nomePaciente} foi atualizado.`,
            profissionalId: profissionalIdRecebido,
          });
          console.log('Notificação de atualização gerada para o profissional recebido.');
        }
      }
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
    const encaminhamento = await Encaminhamento.findByPk(id);

    if (!encaminhamento) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    const { profissionalIdRecebido, assuntoAcolhimento, nomePaciente } = encaminhamento;

    await Encaminhamento.destroy({ where: { id } });

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

exports.criarDiscussaoCaso = async (req, res) => {
  try {
    const { encaminhamentoId } = req.params;
    const { conteudo } = req.body;

    if (!conteudo) {
      req.flash('error_msg', 'Conteúdo é obrigatório.');
      return res.redirect(`/encaminhamentos/${encaminhamentoId}`);
    }

    const encaminhamento = await Encaminhamento.findByPk(encaminhamentoId);
    if (!encaminhamento) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
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
      return res.redirect('/encaminhamentos');
    }

    const autor = usuario.profissional.id;

    await DiscussaoCaso.create({
      conteudo,
      autor,
      encaminhamentoId,
    });

    req.flash('success_msg', 'Discussão de caso criada com sucesso.');
    res.redirect(`/encaminhamentos/${encaminhamentoId}`);
  } catch (error) {
    console.error('Erro ao criar discussão de caso:', error);
    req.flash('error_msg', 'Erro ao criar discussão de caso.');
    res.redirect(`/encaminhamentos/${encaminhamentoId}`);
  }
};

exports.listarDiscussaoCasos = async (req, res) => {
  try {
    const { encaminhamentoId } = req.params;

    const discussoes = await DiscussaoCaso.findAll({
      where: { encaminhamentoId },
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

exports.deletarDiscussaoCaso = async (req, res) => {
  try {
    const { encaminhamentoId, discussaoId } = req.params;

    // Verifica se o fluxo de atendimento existe
    const encaminhamento = await Encaminhamento.findByPk(encaminhamentoId);
    if (!encaminhamento) {
      req.flash('error_msg', 'Fluxo de atendimento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

    // Verifica se a discussão de caso existe
    const discussaoCaso = await DiscussaoCaso.findOne({
      where: { id: discussaoId, encaminhamentoId },
    });

    if (!discussaoCaso) {
      req.flash('error_msg', 'Discussão de caso não encontrada.');
      return res.redirect(`/encaminhamentos/${encaminhamentoId}`);
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
      return res.redirect('/encaminhamentos');
    }

    // Verifica se o usuário é o autor da discussão ou tem permissão de administrador
    if (discussaoCaso.autor !== usuario.profissional.id && usuario.cargo !== 'administrador') {
      req.flash('error_msg', 'Você não tem permissão para deletar esta discussão.');
      return res.redirect(`/encaminhamentos/${encaminhamentoId}`);
    }

    // Deleta a discussão de caso
    await discussaoCaso.destroy();

    req.flash('success_msg', 'Discussão de caso deletada com sucesso.');
    res.redirect(`/encaminhamentos/${encaminhamentoId}`);
  } catch (error) {
    console.error('Erro ao deletar discussão de caso:', error);
    req.flash('error_msg', 'Erro ao deletar discussão de caso.');
    res.redirect(`/encaminhamentos`);
  }
};

exports.viewEncaminhamentosReport = async (req, res) => {
  try {
    const { dataInicio, dataFim, profissional } = req.query;

    const where = {};

    // Filtragem por intervalo de datas
    if (dataInicio && dataFim) {
      where.data = {
        [Op.between]: [dataInicio, dataFim],
      };
    } else if (dataInicio) {
      where.data = {
        [Op.gte]: dataInicio, // Data maior ou igual a dataInicio
      };
    } else if (dataFim) {
      where.data = {
        [Op.lte]: dataFim, // Data menor ou igual a dataFim
      };
    }

    // Filtragem por profissional
    if (profissional) {
      where.adminId = profissional; 
    }

    const encaminhamentos = await Encaminhamento.findAll({
      where, // Adiciona a condição de filtragem
      include: [
        {
          model: Profissional,
          as: 'profissionalEnvio',
          attributes: ['id', 'nome', 'cargo'], // Inclui os atributos desejados do profissional que enviou
        },
        {
          model: Profissional,
          as: 'profissionalRecebido',
          attributes: ['id', 'nome', 'cargo'], // Inclui os atributos desejados do profissional que recebeu
        },
        {
          model: Atendimento,
          as: 'atendimento',
          attributes: ['id', 'nomePaciente'], // Inclui os atributos desejados do atendimento associado
        },
      ],
    });

    // Verifica se há encaminhamentos cadastrados
    if (encaminhamentos.length === 0) {
      return res.status(404).render('relatorios', {
        message: 'Nenhum encaminhamento cadastrado.',
        layout: false,
      });
    }

    res.render('relatorios/viewEncaminhamentosReport', {
      encaminhamentos,
      layout: false,
    });
  } catch (error) {
    console.error('Erro ao exibir o relatório de encaminhamentos:', error);
    res.status(500).render('error', {
      message: 'Erro ao exibir o relatório. Tente novamente mais tarde.',
      layout: false,
    });
  }
};
