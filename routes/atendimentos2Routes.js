const express = require('express');
const Atendimento2Controller = require('../controllers/atendimento2Controller');

const router = express.Router();

router.post('/criar', Atendimento2Controller.criarAtendimento);

router.get('/create', Atendimento2Controller.exibirFormularioCriacao);


router.get('/', Atendimento2Controller.listarAtendimentos);

router.get('/buscarPaciente', Atendimento2Controller.buscarPaciente);

router.get('/detalhes/:id', Atendimento2Controller.visualizarAtendimento);


module.exports = router;
