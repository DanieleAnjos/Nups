const express = require('express');
const router = express.Router();
const MensagemController = require('../controllers/MensagemController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/arquivos'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

router.get('/enviar', MensagemController.exibirFormularioEnvio);

router.post('/enviar', upload.single('arquivo'), MensagemController.enviarMensagem);

router.get('/', MensagemController.listarMensagensRecebidas);

router.get('/:id', MensagemController.visualizarMensagem);

router.get('/enviadas/:id', MensagemController.detalhesMensagemEnviada);

router.post('/deletar/:id', MensagemController.deletarMensagem);


router.get('/:id/responder',  MensagemController.responderMensagem);
router.post('/:id/responder', upload.single('arquivo'), MensagemController.enviarResposta);

router.get('/:id/arquivar', MensagemController.arquivarMensagem);

router.get('/:id/desarquivar', MensagemController.desarquivarMensagem);






module.exports = router;
