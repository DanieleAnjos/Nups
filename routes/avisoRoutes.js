const express = require('express');
const router = express.Router();
const avisoController = require('../controllers/avisoController');

router.post('/', avisoController.createAviso);
router.get('/create', avisoController.renderCreateAviso);
router.get('/do-dia', avisoController.getAvisosDoDia);

router.get('/', avisoController.getAllAvisos);
router.put('/:id', avisoController.updateAviso);
router.get('/:id', avisoController.renderEditAviso);
router.delete('/:id', avisoController.deleteAviso);



module.exports = router;
