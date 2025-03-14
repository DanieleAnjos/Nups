const Encaminhamento = require('../models/Encaminhamento');
const Notificacao = require('../models/Notificacao');
const Profissional = require('../models/Profissional');
const Atendimento = require('../models/Atendimento');
const { Op } = require('sequelize');  

const moment = require('moment');
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

    if (nomePaciente) {
      whereConditions.nomePaciente = { [Op.like]: `%${nomePaciente}%` };
    }

    if (profissional) {
      whereConditions[Op.or] = [
        { '$profissionalEnvio.nome$': { [Op.like]: `%${profissional}%` } },
        { '$profissionalRecebido.nome$': { [Op.like]: `%${profissional}%` } }
      ];
    }

    // Filtro por data flexível
    if (dataInicio && dataFim) {
      whereConditions.data = { [Op.between]: [dataInicio, dataFim] };
    } else if (dataInicio) {
      whereConditions.data = { [Op.gte]: dataInicio };
    } else if (dataFim) {
      whereConditions.data = { [Op.lte]: dataFim };
    }

    // Filtro por mês
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

    // Restrições adicionais para Gestores
    if (userCargo.includes('gestor')) {
      if (userCargo.includes('servico social')) {
        whereConditions[Op.or] = [
          { '$profissionalEnvio.cargo$': 'assistente social' },
          { '$profissionalRecebido.cargo$': 'assistente social' }
        ];
      } else if (userCargo.includes('psicologia')) {
        whereConditions[Op.or] = [
          { '$profissionalEnvio.cargo$': 'psicólogo' },
          { '$profissionalRecebido.cargo$': 'psicólogo' }
        ];
      } else if (userCargo.includes('psiquiatria')) {
        whereConditions[Op.or] = [
          { '$profissionalEnvio.cargo$': 'psiquiatra' },
          { '$profissionalRecebido.cargo$': 'psiquiatra' }
        ];
      }
    }

    if (userCargo !== 'administrador' && userCargo !== 'adm') {
      whereConditions[Op.or] = [
        { '$profissionalEnvio.cargo$': userCargo },
        { '$profissionalRecebido.cargo$': userCargo }
      ];
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
    

    res.render("encaminhamentos/create", {
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
      ],
    });

    if (!encaminhamento) {
      req.flash('error_msg', 'Encaminhamento não encontrado.');
      return res.redirect('/encaminhamentos');
    }

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

    const pacientes = await Paciente.findAll({
      attributes: ['id', 'nome', 'matricula'], 
      order: [['nome', 'ASC']]
    });

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
    

    res.render('encaminhamentos/edit', { 
      encaminhamento: encaminhamento.get({ plain: true }),
      profissionalIdEnvio, 
      profissionaisRecebimento,
      pacientes,
      profissionaisPsicologia,
      profissionaisServicoSocial,
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

    // Verifica se o número de processo já está associado a outro encaminhamento (exceto o próprio encaminhamento)
    const numeroProcessoExistente = await Encaminhamento.findOne({
      where: {
        numeroProcesso,
        id: { [Op.ne]: id }, // Exclui o encaminhamento atual da busca
      },
    });

    if (numeroProcessoExistente) {
      req.flash('error_msg', 'Este número de processo já está associado a outro encaminhamento.');
      return res.redirect(`/encaminhamentos/${id}/edit`);
    }

    // Verifica se a matrícula do paciente já está associada a outro encaminhamento (exceto o próprio encaminhamento)
    const matriculaPacienteExistente = await Encaminhamento.findOne({
      where: {
        matriculaPaciente,
        id: { [Op.ne]: id }, // Exclui o encaminhamento atual da busca
      },
    });

    if (matriculaPacienteExistente) {
      req.flash('error_msg', 'Este paciente já possui um encaminhamento associado com esta matrícula.');
      return res.redirect(`/encaminhamentos/${id}/edit`);
    }

    // Atualiza o encaminhamento
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


