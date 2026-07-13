const express = require('express');
const { generateDescription } = require('../controllers/aiController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/generate-description', authenticateJWT, authorizeRoles('SELLER'), generateDescription);

module.exports = router;
