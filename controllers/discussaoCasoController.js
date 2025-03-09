const DiscussaoCaso = require('../models/DiscussaoCaso');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional');
const Usuario = require('../models/Usuario');


exports.renderizarFormularioCriacao = async (req, res) => {
  try {
    const { atendimentoId } = req.params;

    const atendimento = await Atendimento.findByPk(atendimentoId);
    if (!atendimento) {
      return res.status(404).render('error', { message: 'Atendimento não encontrado.' });
    }

    res.render('discussoes/create', { atendimentoId });
  } catch (error) {
    console.error('Erro ao renderizar formulário de criação:', error);
    res.status(500).render('error', { message: 'Erro interno ao renderizar formulário de criação.' });
  }
};

exports.criarDiscussaoCaso = async (req, res) => {
  try {
    const { atendimentoId } = req.params; 
    const { conteudo } = req.body; 

    if (!conteudo) {
      return res.status(400).render('error', { message: 'Conteúdo é obrigatório.' });
    }

    const atendimento = await Atendimento.findByPk(atendimentoId);
    if (!atendimento) {
      return res.status(404).render('error', { message: 'Atendimento não encontrado.' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).render('error', { message: 'Você precisa estar logado para criar uma discussão.' });
    }

    // Verifique se o usuário tem um 'profissional' associado
    const usuario = await Usuario.findOne({
      where: { id: req.user.id },
      include: {
        model: Profissional,
        as: 'profissional',  // Usando o alias 'profissional'
      },
    });

    if (!usuario || !usuario.profissional) {
      return res.status(401).render('error', { message: 'Você precisa ter um profissional associado para criar uma discussão.' });
    }

    const autor = usuario.profissional.id;  // Agora usa o ID do profissional

    const novaDiscussao = await DiscussaoCaso.create({ conteudo, autor, atendimentoId });

    req.flash('success_msg', 'Discussão de caso criada com sucesso.');
    res.status(201).redirect(`/atendimentos`);
  } catch (error) {
    console.error('Erro ao criar discussão de caso:', error);
    res.status(500).render('error', { message: 'Erro interno ao criar discussão de caso.' });
  }
};


exports.listarDiscussaoCasos = async (req, res) => {
  try {
    const { atendimentoId } = req.query;

    const discussaoCasos = await DiscussaoCaso.findAll({
      where: atendimentoId ? { atendimentoId } : {},
      include: { model: Atendimento, as: 'atendimento' }, 
    });

    res.status(200).render('discussoes/index', { discussoes: discussaoCasos });
  } catch (error) {
    console.error('Erro ao listar discussões de caso:', error);
    res.status(500).render('error', { message: 'Erro interno ao listar discussões de caso.' });
  }
};

exports.buscarDiscussaoCaso = async (req, res) => {
  try {
    const { id } = req.params;

    const discussaoCaso = await DiscussaoCaso.findByPk(id, {
      include: [
        {
          model: Atendimento,
          as: 'atendimento',
          include: [
            {
              model: Profissional, 
              as: 'profissional',
            },
          ],
        },
      ],
    });

    if (!discussaoCaso) {
      return res.status(404).render('error', { message: 'Discussão de caso não encontrada.' });
    }

    res.status(200).render('discussoes/detalhes', { discussaoCaso });
  } catch (error) {
    console.error('Erro ao buscar discussão de caso:', error);
    res.status(500).render('error', { message: 'Erro interno ao buscar discussão de caso.' });
  }
};

exports.exibirFormularioEdicao = async (req, res) => {
  try {
    const { id } = req.params;
    const discussaoCaso = await DiscussaoCaso.findByPk(id);

    if (!discussaoCaso) {
      return res.status(404).render('error', { message: 'Discussão de caso não encontrada.' });
    }

    const atendimentos = await Atendimento.findAll(); 

    res.render('discussoes/edit', { 
      discussaoCaso,
      atendimentos 
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição:', error);
    res.status(500).render('error', { message: 'Erro ao exibir formulário de edição.' });
  }
};


exports.atualizarDiscussaoCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const { conteudo, atendimentoId } = req.body;

    const discussaoCaso = await DiscussaoCaso.findByPk(id);
    if (!discussaoCaso) {
      return res.status(404).render('error', { message: 'Discussão de caso não encontrada.' });
    }

    if (atendimentoId) {
      const atendimento = await Atendimento.findByPk(atendimentoId);
      if (!atendimento) {
        return res.status(404).render('error', { message: 'Atendimento não encontrado.' });
      }
      discussaoCaso.atendimentoId = atendimentoId;
    }

    discussaoCaso.conteudo = conteudo ?? discussaoCaso.conteudo;

    await discussaoCaso.save();

    req.flash('sucess_msg', 'Sucesso ao atualizar discussão de caso');
    res.status(200).redirect(`/discussoes/${discussaoCaso.id}`);
  } catch (error) {
    console.error('Erro ao atualizar discussão de caso:', error);
    res.status(500).render('error', { message: 'Erro interno ao atualizar discussão de caso.' });
  }
};

exports.deletarDiscussaoCaso = async (req, res) => {
  try {
    const { id } = req.params;

    const discussaoCaso = await DiscussaoCaso.findByPk(id);
    if (!discussaoCaso) {
      return res.status(404).render('error', { message: 'Discussão de caso não encontrada.' });
    }

    await discussaoCaso.destroy();

    req.flash('sucess_msg', 'Sucesso ao deletar discussão de caso');
    res.status(200).render('discussoes/index', { message: 'Discussão de caso deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar discussão de caso:', error);
    res.status(500).render('error', { message: 'Erro interno ao deletar discussão de caso.' });
  }
};
