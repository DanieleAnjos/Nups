const express = require('express');
const router = express.Router();
const EncaminhamentoController = require('../controllers/encaminhamentoController');

// Rotas para encaminhamentos
router.get('/', EncaminhamentoController.index); // Listar todos os encaminhamentos
router.get('/create', EncaminhamentoController.create); // Exibir formulário de criação
router.post('/', EncaminhamentoController.store); // Criar um novo encaminhamento
router.get('/:id/edit', EncaminhamentoController.edit); // Exibir formulário de edição
router.put('/:id', EncaminhamentoController.update); // Atualizar um encaminhamento
router.delete('/:id', EncaminhamentoController.destroy); // Deletar um encaminhamento

router.get('/:id', EncaminhamentoController.detalhesEncaminhamento);

// Rota para marcar um encaminhamento como "visto"
router.get('/:id/visto', EncaminhamentoController.marcarVisto);

module.exports = router;