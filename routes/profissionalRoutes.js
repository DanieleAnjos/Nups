const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const profissionalController = require('../controllers/profissionalController');

router.use(authController.ensureAuthenticated);

router.get('/', profissionalController.index);
router.get('/create', profissionalController.create);
router.post('/', profissionalController.store);
router.get('/edit/:id', profissionalController.edit);
router.put('/:id', profissionalController.update); // Esta linha deve estar presente
router.delete('/:id', profissionalController.delete);

module.exports = router;
