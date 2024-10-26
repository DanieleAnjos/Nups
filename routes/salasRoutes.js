const express = require('express');
const router = express.Router();
const salaController = require('../controllers/salaController');
const ensureAuthenticated = require('../middlewares/ensureAuthenticated');

router.get('/', salaController.listarSalas);

router.get('/create', ensureAuthenticated, salaController.formularioCriar);

router.post('/', ensureAuthenticated, salaController.criarSala);

router.get('/:id/editar', ensureAuthenticated, salaController.formularioEditar);

router.put('/:id', ensureAuthenticated, salaController.atualizarSala);

router.delete('/:id', ensureAuthenticated, salaController.deletarSala);

module.exports = router;
