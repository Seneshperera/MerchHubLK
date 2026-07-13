const express = require('express');
const { getContacts, getThread, sendMessage } = require('../controllers/messageController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authenticateJWT);

router.get('/contacts', getContacts);
router.get('/thread/:userId', getThread);
router.post('/', sendMessage);

module.exports = router;
