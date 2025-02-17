const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { upload, uploadErrorHandler } = require('../middlewares/uploadMiddleware'); 

const methodOverride = require('method-override');

router.post('/enviar' , eventoController.criarEvento);
router.get('/create', eventoController.create); 

router.get('/', eventoController.listarEventos);

router.put('/:id', eventoController.atualizarEvento);
router.get('/:id/edit', eventoController.edit);

router.delete('/:id', eventoController.deletarEvento);

module.exports = router;

