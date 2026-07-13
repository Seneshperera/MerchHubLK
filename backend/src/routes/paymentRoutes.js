const express = require('express');
const { createCheckoutSession, confirmPayment } = require('../controllers/paymentController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authenticateJWT);

router.post('/stripe/create-checkout', createCheckoutSession);
router.post('/stripe/confirm', confirmPayment);

module.exports = router;
