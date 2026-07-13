const express = require('express');
const { getNotifications, markRead } = require('../controllers/notificationController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authenticateJWT);

router.get('/', getNotifications);
router.patch('/:id/read', markRead);

module.exports = router;
