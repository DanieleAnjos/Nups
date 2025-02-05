const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController'); // Verifique o caminho

// Página inicial de relatórios
router.get('/', reportController.index); 

// Rota para gerar o relatório de escalas em Excel
router.get('/relatorio/excel', reportController.gerarRelatorioEscalasExcel);

module.exports = router;
