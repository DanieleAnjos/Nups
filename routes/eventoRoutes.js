const express = require('express');
const eventoController = require('../controllers/eventoController');
const { upload, uploadErrorHandler } = require('../middlewares/uploadMiddleware'); 

const methodOverride = require('method-override');

const router = express.Router();

router.use(methodOverride('_method'));

router.get('/', eventoController.index);            
router.get('/create', eventoController.create);     
router.post('/', upload.array('imagens', 10), uploadErrorHandler, eventoController.store); 
router.get('/:id/edit', eventoController.edit);     
router.put('/:id', upload.array('imagens', 10), eventoController.update); 
router.delete('/:id', eventoController.destroy);    

module.exports = router;
