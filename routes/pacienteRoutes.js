const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');

router.get('/', pacienteController.index);

router.get('/create', pacienteController.create);
router.post('/', pacienteController.store);

router.get('/:id/edit', pacienteController.edit);
router.put('/:id', pacienteController.update);

router.delete('/:id', pacienteController.delete);

module.exports = router;
