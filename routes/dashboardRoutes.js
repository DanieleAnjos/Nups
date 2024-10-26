const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const ensureAuthenticated = require('../middlewares/ensureAuthenticated');

router.get('/adm', ensureAuthenticated, dashboardController.adm);

module.exports = router;
