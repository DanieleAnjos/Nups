const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

router.get('/produtos', produtoController.index);

router.get('/produtos/create', produtoController.create);

router.post('/produtos', produtoController.store);

router.get('/produtos/:id/edit', produtoController.edit);

router.put('/produtos/:id', produtoController.update);

router.delete('/produtos/:id', produtoController.destroy);

module.exports = router;
