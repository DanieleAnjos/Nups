const express = require('express');
const router = express.Router();
const ocorrenciaController = require('../controllers/ocorrenciaController');

router.get('/', ocorrenciaController.index);

router.get('/create', ocorrenciaController.create);

router.post('/', ocorrenciaController.store);

router.get('/:id/edit', ocorrenciaController.edit);

router.put('/:id', ocorrenciaController.update);

router.get('/:id', ocorrenciaController.show);

router.get('/viewReport', ocorrenciaController.viewOcorrenciasReport);


router.get('/relatorio', ocorrenciaController.generateOcorrenciaReport);

router.get('/relatorio/excel', ocorrenciaController.generateOcorrenciaReportExcel);


router.delete('/:id', ocorrenciaController.destroy);



module.exports = router;
