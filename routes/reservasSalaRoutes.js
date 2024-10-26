const express = require('express');
const reservasSalaController = require('../controllers/reservasSalaController.js');

const router = express.Router();

router.get('/', reservasSalaController.listarReservas);

router.get('/create', reservasSalaController.formCriarReserva);

router.post('/', reservasSalaController.criarReserva);

router.get('/:id/edit', reservasSalaController.formEditarReserva);

router.put('/:id', reservasSalaController.atualizarReserva);

router.delete('/:id', reservasSalaController.deletarReserva);

module.exports = router;
