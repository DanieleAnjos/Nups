const express = require('express');

const router = express.Router();
const fornecedorController = require('../controllers/fornecedorController');

router.get('/fornecedores', fornecedorController.index); 
router.get('/fornecedores/create', fornecedorController.create); 
router.post('/fornecedores', fornecedorController.store); 
router.get('/fornecedores/:id/edit', fornecedorController.edit); 
router.put('/fornecedores/:id', fornecedorController.update); 
router.delete('/fornecedores/:id', fornecedorController.destroy); 

module.exports = router;
