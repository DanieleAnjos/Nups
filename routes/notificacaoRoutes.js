const express = require('express');
const router = express.Router();
const NotificacaoController = require('../controllers/NotificacaoController');

router.get('/', NotificacaoController.showNotifications);

router.post('/markAsRead/:id', NotificacaoController.markAsRead);

module.exports = router;
