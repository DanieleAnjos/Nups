const express = require('express');
const router = express.Router();
const profissionalController = require('../controllers/profissionalController');

router.get('/', profissionalController.index);
router.get('/create', profissionalController.create);
router.post('/', profissionalController.store);
router.get('/edit/:id', profissionalController.edit);
router.put('/:id', profissionalController.update); 
router.delete('/:id', profissionalController.delete);

router.get('/relatorio', profissionalController.generateProfissionalReport);

router.get('/viewReport', profissionalController.viewProfissionaisReport);

router.get('/perfil/:id', profissionalController.show);




module.exports = router;
