const express = require('express');

const router = express.Router();
const ajusteEstoqueController = require('../controllers/ajusteEstoqueController');

router.get('/ajustes', ajusteEstoqueController.index); 

router.get('/ajustes/create', ajusteEstoqueController.create); 
router.post('/ajustes', ajusteEstoqueController.store); 

router.get('/ajustes/:id/edit', ajusteEstoqueController.edit); 
router.put('/ajustes/:id', ajusteEstoqueController.update); 

router.delete('/ajustes/:id', ajusteEstoqueController.destroy); 

module.exports = router;
