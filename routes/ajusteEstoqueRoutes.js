const express = require('express');
const router = express.Router();
const ajusteEstoqueController = require('../controllers/ajusteEstoqueController'); // Importe o controlador corretamente

// Defina as rotas
router.post('/', ajusteEstoqueController.store); // Exemplo de rota POST

router.get('/', ajusteEstoqueController.index); // Exemplo de rota GET
router.get('/create', ajusteEstoqueController.create); // Exemplo de rota
router.delete('/:id', ajusteEstoqueController.destroy); // Exemplo de rota DELETE

module.exports = router;