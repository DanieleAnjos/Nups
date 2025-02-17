const express = require('express');
const router = express.Router();
const salaController = require('../controllers/salaController');

router.get('/', salaController.listarSalas);

router.get('/create',  salaController.formularioCriar);

router.post('/',  salaController.criarSala);

router.get('/:id/edit',  salaController.formularioEditar);

router.put('/:id', salaController.atualizarSala);

router.delete('/:id', salaController.deletarSala);

module.exports = router;
