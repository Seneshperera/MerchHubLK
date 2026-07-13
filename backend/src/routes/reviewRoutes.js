const express = require('express');
const { getProductReviews, createReview } = require('../controllers/reviewController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/:productId', getProductReviews);
router.post('/:productId', authenticateJWT, authorizeRoles('BUYER'), createReview);

module.exports = router;
