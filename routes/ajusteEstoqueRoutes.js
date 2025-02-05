const express = require('express');

const router = express.Router();
const ajusteEstoqueController = require('../controllers/ajusteEstoqueController');

router.get('/', ajusteEstoqueController.index); 

router.get('/create', ajusteEstoqueController.create); 
router.post('/', ajusteEstoqueController.store); 


router.get('/:id/edit', ajusteEstoqueController.edit); 
router.put('/:id', ajusteEstoqueController.update); 

router.delete('/:id', ajusteEstoqueController.destroy); 

module.exports = router;
