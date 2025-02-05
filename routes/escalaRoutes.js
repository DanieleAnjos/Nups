const express = require('express');

const router = express.Router();
const escalaController = require('../controllers/escalaController');

router.get('/', escalaController.index);

router.get('/relatorio', escalaController.generateEscalaReport);

router.get('/viewReport', escalaController.viewEscalasReport);


router.get('/create', escalaController.create); 
router.post('/', escalaController.store); 

router.get('/:id/edit', escalaController.edit);

router.put('/:id', escalaController.update);
router.delete('/:id', escalaController.destroy); 

module.exports = router;
