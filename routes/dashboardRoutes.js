const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const ensureAuthenticated = require('../middlewares/ensureAuthenticated');

router.get('/adm',  dashboardController.adm);
router.get('/assistente-social', dashboardController.assistenteSocial);
router.get('/psicologo-psiquiatra', dashboardController.psicologoPsiquiatra);

module.exports = router;
