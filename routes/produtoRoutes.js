const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

router.get('/', produtoController.listarProdutos);

router.get('/create', produtoController.create);

router.post('/', produtoController.store);

router.get('/:id/edit', produtoController.edit);

router.put('/:id', produtoController.update);

router.delete('/:id', produtoController.destroy);

router.get('/quantidade_atual', produtoController.listarProdutos);

router.post('/', produtoController.ajustarEstoque);



module.exports = router;
