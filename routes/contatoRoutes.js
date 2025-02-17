const express = require('express');
const router = express.Router();
const contatoController = require('../controllers/contatoController');

router.post('/enviar', contatoController.sendContactEmail); 

module.exports = router;
