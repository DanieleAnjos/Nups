const express = require('express');
const router = express.Router();
const MensagemController = require('../controllers/MensagemController');

router.get('/enviar', MensagemController.exibirFormularioEnvio);

router.post('/enviar', MensagemController.enviarMensagem);

router.get('/', MensagemController.listarMensagensRecebidas);

router.get('/:id', MensagemController.visualizarMensagem);


router.get('/:id/responder',  MensagemController.responderMensagem);
router.post('/:id/responder', MensagemController.enviarResposta);

router.get('/:id/arquivar', MensagemController.arquivarMensagem);

router.get('/:id/desarquivar', MensagemController.desarquivarMensagem);






module.exports = router;
