const express = require('express');
const router = express.Router();
const atendimentoController = require('../controllers/atendimentoController');

router.get('/', atendimentoController.index);
router.get('/create', atendimentoController.create);
router.post('/', atendimentoController.store);
router.get('/:id/edit', atendimentoController.edit);
router.put('/:id', atendimentoController.update);
router.delete('/:id', atendimentoController.destroy);

module.exports = router;
