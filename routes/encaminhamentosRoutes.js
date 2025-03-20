const express = require('express');
const router = express.Router();
const EncaminhamentoController = require('../controllers/encaminhamentoController');

router.get('/', EncaminhamentoController.index); 
router.get('/create', EncaminhamentoController.create); 
router.post('/', EncaminhamentoController.store); 
router.get('/:id/edit', EncaminhamentoController.edit); 
router.put('/:id', EncaminhamentoController.update);
router.delete('/:id', EncaminhamentoController.destroy);
router.get('/:id', EncaminhamentoController.detalhesEncaminhamento);
router.get('/:id/visto', EncaminhamentoController.marcarVisto);

router.post('/:encaminhamentoId/discussoes', EncaminhamentoController.criarDiscussaoCaso);

router.get('/viewReport', EncaminhamentoController.viewEncaminhamentosReport);


router.get('/:encaminhamentoId/discussoes', EncaminhamentoController.listarDiscussaoCasos);
router.delete('/:encaminhamentoId/discussoes/:discussaoId', EncaminhamentoController.deletarDiscussaoCaso);


module.exports = router;