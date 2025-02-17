const express = require('express');
const router = express.Router();
const noticiaController = require('../controllers/noticiaController');
const { upload, uploadErrorHandler } = require('../middlewares/uploadMiddleware'); 

const methodOverride = require('method-override');

router.post('/enviar' , noticiaController.criarNoticia);
router.get('/create', noticiaController.create); 

router.get('/', noticiaController.listarNoticia);

router.put('/:id', noticiaController.atualizarNoticia);
router.get('/:id/edit', noticiaController.edit);

router.delete('/:id', noticiaController.deletarNoticia);

module.exports = router;

