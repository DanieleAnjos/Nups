const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController'); // Verifique o caminho

router.get('/', reportController.index); 




module.exports = router;
