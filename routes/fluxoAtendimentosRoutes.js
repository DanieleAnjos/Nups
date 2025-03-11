const express = require('express');
const router = express.Router();
const FluxoAtendimentosController = require('../controllers/fluxoAtendimentosController');

router.get('/', FluxoAtendimentosController.index); 
router.get('/create', FluxoAtendimentosController.create); 
router.post('/', FluxoAtendimentosController.store); 
router.get('/:id', FluxoAtendimentosController.detalhesEncaminhamento); 
router.get('/:id/visto', FluxoAtendimentosController.marcarVisto); 
router.get('/:id/edit', FluxoAtendimentosController.edit); 
router.put('/:id', FluxoAtendimentosController.update); 
router.delete('/:id', FluxoAtendimentosController.destroy); 

module.exports = router;