const express = require('express');
const router = express.Router();
const { dashboardController, checkUserAndProfissional } = require('../controllers/dashboardController');

router.get('/adm', checkUserAndProfissional, dashboardController.adm);
router.get('/assistente-social', checkUserAndProfissional, dashboardController.assistenteSocial);
router.get('/psicologo-psiquiatra', checkUserAndProfissional, dashboardController.psicologoPsiquiatra);

module.exports = router;
