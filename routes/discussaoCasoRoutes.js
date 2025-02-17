const express = require('express');
const router = express.Router();
const discussaoCasoController = require('../controllers/discussaoCasoController');

router.get('/create/:atendimentoId', discussaoCasoController.renderizarFormularioCriacao);

router.post('/create/:atendimentoId', discussaoCasoController.criarDiscussaoCaso);

router.get('/', discussaoCasoController.listarDiscussaoCasos);

router.get('/:id', discussaoCasoController.buscarDiscussaoCaso);

router.get('/:id/edit', discussaoCasoController.exibirFormularioEdicao);

router.put('/:id', discussaoCasoController.atualizarDiscussaoCaso);

router.delete('/:id', discussaoCasoController.deletarDiscussaoCaso);

module.exports = router;