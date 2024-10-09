const AjusteEstoque = require('../models/AjusteEstoque');
const Produto = require('../models/Produto');

// Listar todos os ajustes de estoque
exports.index = async (req, res) => {
  try {
    const ajustes = await AjusteEstoque.findAll({ include: 'produto' });
    res.render('ajustes/index', { ajustes });
  } catch (error) {
    console.error(error); // Log do erro no servidor
    res.status(500).send('Erro ao listar ajustes de estoque.'); // Mensagem amigável ao usuário
  }
};

// Renderizar formulário de criação de ajuste de estoque
exports.create = async (req, res) => {
  try {
    const produtos = await Produto.findAll();
    const produtoIdSelecionado = req.query.produtoId || null; // Pega o produtoId da query string
    res.render('ajustes/create', { produtos, produtoIdSelecionado });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar produtos para o formulário de criação.'); // Mensagem amigável
  }
};

// Criar um novo ajuste de estoque
exports.store = async (req, res) => {
  try {
    await AjusteEstoque.create(req.body);
    res.redirect('/ajustes');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao criar ajuste de estoque.'); // Mensagem amigável
  }
};

// Renderizar formulário de edição de ajuste de estoque
exports.edit = async (req, res) => {
  try {
    const ajuste = await AjusteEstoque.findByPk(req.params.id);
    const produtos = await Produto.findAll();
    if (ajuste) {
      res.render('ajustes/edit', { ajuste, produtos });
    } else {
      res.status(404).send('Ajuste não encontrado'); // Mensagem de erro 404
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar ajuste para edição.'); // Mensagem amigável
  }
};

// Atualizar ajuste de estoque
exports.update = async (req, res) => {
  try {
    const [updated] = await AjusteEstoque.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      res.redirect('/ajustes');
    } else {
      res.status(404).send('Ajuste não encontrado para atualizar.'); // Mensagem de erro 404
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar ajuste de estoque.'); // Mensagem amigável
  }
};

// Deletar ajuste de estoque
exports.destroy = async (req, res) => {
  try {
    const deleted = await AjusteEstoque.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.redirect('/ajustes');
    } else {
      res.status(404).send('Ajuste não encontrado para deletar.'); // Mensagem de erro 404
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao deletar ajuste de estoque.'); // Mensagem amigável
  }
};
