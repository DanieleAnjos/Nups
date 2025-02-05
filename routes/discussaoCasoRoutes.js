const express = require('express');
const router = express.Router();
const discussaoCasoController = require('../controllers/discussaoCasoController');

// Renderizar o formulário de criação de discussão
router.get('/create/:atendimentoId', discussaoCasoController.renderizarFormularioCriacao);

// Criar uma nova Discussão de Caso (processar o formulário)
router.post('/create/:atendimentoId', discussaoCasoController.criarDiscussaoCaso);

// Listar todas as Discussões de Caso
router.get('/', discussaoCasoController.listarDiscussaoCasos);

// Buscar uma Discussão de Caso por ID
router.get('/:id', discussaoCasoController.buscarDiscussaoCaso);

router.get('/:id/edit', discussaoCasoController.exibirFormularioEdicao);


// Atualizar uma Discussão de Caso por ID
router.put('/:id', discussaoCasoController.atualizarDiscussaoCaso);

// Deletar uma Discussão de Caso por ID
router.delete('/:id', discussaoCasoController.deletarDiscussaoCaso);

module.exports = router;