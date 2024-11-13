const express = require('express');
const router = express.Router();
const EncaminhamentoController = require('../controllers/encaminhamentoController');

router.get('/', EncaminhamentoController.index); 
router.get('/create', EncaminhamentoController.create); 
router.post('/', EncaminhamentoController.store); 
router.get('/:id/edit', EncaminhamentoController.edit); 
router.put('/:id', EncaminhamentoController.update); 
router.delete('/:id', EncaminhamentoController.destroy);

module.exports = router;
