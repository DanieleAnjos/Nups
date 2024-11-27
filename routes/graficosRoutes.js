const express = require('express');
const graficosController = require('../controllers/graficosController');
const router = express.Router();

router.get('/', graficosController);
  
module.exports = router;
