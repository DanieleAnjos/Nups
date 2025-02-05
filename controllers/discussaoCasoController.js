const DiscussaoCaso = require('../models/DiscussaoCaso');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional');



// Criar uma nova Discussão de Caso
// Criar uma nova Discussão de Caso com um atendimentoId específico

exports.renderizarFormularioCriacao = async (req, res) => {
  try {
    const { atendimentoId } = req.params;

    // Verifica se o atendimento existe
    const atendimento = await Atendimento.findByPk(atendimentoId);
    if (!atendimento) {
      return res.status(404).render('error', { message: 'Atendimento não encontrado.' });
    }

    // Renderiza a view de cadastro
    res.render('discussoes/create', { atendimentoId });
  } catch (error) {
    console.error('Erro ao renderizar formulário de criação:', error);
    res.status(500).render('error', { message: 'Erro interno ao renderizar formulário de criação.' });
  }
};

exports.criarDiscussaoCaso = async (req, res) => {
  try {
    const { atendimentoId } = req.params; // Acessa o atendimentoId da URL
    const { conteudo } = req.body; // Não precisa mais do autor, pois será o profissional logado

    // Validação dos campos obrigatórios
    if (!conteudo) {
      return res.status(400).render('error', { message: 'Conteúdo é obrigatório.' });
    }

    // Verifica se o atendimento existe
    const atendimento = await Atendimento.findByPk(atendimentoId);
    if (!atendimento) {
      return res.status(404).render('error', { message: 'Atendimento não encontrado.' });
    }

    // Verifica se o profissional está logado
    if (!req.user || !req.user.id) {
      return res.status(401).render('error', { message: 'Você precisa estar logado para criar uma discussão.' });
    }

    const autor = req.user.id; // O autor será o ID do profissional logado

    // Cria a discussão de caso
    const novaDiscussao = await DiscussaoCaso.create({ conteudo, autor, atendimentoId });

    // Redireciona para a página de detalhes da discussão
    res.status(201).redirect(`/discussoes/${novaDiscussao.id}`);
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
      include: { model: Atendimento, as: 'atendimento' }, // Inclui os dados do atendimento
    });

    // Renderiza a view de listagem com as discussões de caso
    res.status(200).render('discussoes/index', { discussoes: discussaoCasos });
  } catch (error) {
    console.error('Erro ao listar discussões de caso:', error);
    res.status(500).render('error', { message: 'Erro interno ao listar discussões de caso.' });
  }
};

// Buscar uma Discussão de Caso por ID
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
              model: Profissional, // Inclui o modelo Profissional
              as: 'profissional', // Alias do relacionamento
            },
          ],
        },
      ],
    });

    if (!discussaoCaso) {
      return res.status(404).render('error', { message: 'Discussão de caso não encontrada.' });
    }

    // Renderiza a view de detalhes com a discussão de caso
    res.status(200).render('discussoes/detalhes', { discussaoCaso });
  } catch (error) {
    console.error('Erro ao buscar discussão de caso:', error);
    res.status(500).render('error', { message: 'Erro interno ao buscar discussão de caso.' });
  }
};

// Exibir formulário de edição da Discussão de Caso
exports.exibirFormularioEdicao = async (req, res) => {
  try {
    const { id } = req.params;
    const discussaoCaso = await DiscussaoCaso.findByPk(id);

    if (!discussaoCaso) {
      return res.status(404).render('error', { message: 'Discussão de caso não encontrada.' });
    }

    const atendimentos = await Atendimento.findAll(); // Buscar todos os atendimentos

    res.render('discussoes/edit', { 
      discussaoCaso,
      atendimentos 
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição:', error);
    res.status(500).render('error', { message: 'Erro ao exibir formulário de edição.' });
  }
};


// Atualizar uma Discussão de Caso por ID
exports.atualizarDiscussaoCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const { conteudo, atendimentoId } = req.body;

    // Busca a discussão de caso pelo ID
    const discussaoCaso = await DiscussaoCaso.findByPk(id);
    if (!discussaoCaso) {
      return res.status(404).render('error', { message: 'Discussão de caso não encontrada.' });
    }

    // Verifica se o atendimento existe
    if (atendimentoId) {
      const atendimento = await Atendimento.findByPk(atendimentoId);
      if (!atendimento) {
        return res.status(404).render('error', { message: 'Atendimento não encontrado.' });
      }
      discussaoCaso.atendimentoId = atendimentoId;
    }

    // Atualiza o conteúdo
    discussaoCaso.conteudo = conteudo ?? discussaoCaso.conteudo;

    // Salva as alterações
    await discussaoCaso.save();

    // Redireciona para a página de detalhes da discussão
    res.status(200).redirect(`/discussoes/${discussaoCaso.id}`);
  } catch (error) {
    console.error('Erro ao atualizar discussão de caso:', error);
    res.status(500).render('error', { message: 'Erro interno ao atualizar discussão de caso.' });
  }
};

// Deletar uma Discussão de Caso por ID
exports.deletarDiscussaoCaso = async (req, res) => {
  try {
    const { id } = req.params;

    const discussaoCaso = await DiscussaoCaso.findByPk(id);
    if (!discussaoCaso) {
      return res.status(404).render('error', { message: 'Discussão de caso não encontrada.' });
    }

    await discussaoCaso.destroy();

    // Renderiza a view de listagem após a exclusão
    res.status(200).render('discussoes/index', { message: 'Discussão de caso deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar discussão de caso:', error);
    res.status(500).render('error', { message: 'Erro interno ao deletar discussão de caso.' });
  }
};
