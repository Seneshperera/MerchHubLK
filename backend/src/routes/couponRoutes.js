const express = require('express');
const { getCoupons, createCoupon, deleteCoupon, validateCoupon } = require('../controllers/couponController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();

// Public/Buyer endpoint to validate coupon
router.post('/validate', authenticateJWT, authorizeRoles('BUYER'), validateCoupon);

// Seller coupon management
router.get('/', authenticateJWT, authorizeRoles('SELLER'), getCoupons);
router.post('/', authenticateJWT, authorizeRoles('SELLER'), createCoupon);
router.delete('/:id', authenticateJWT, authorizeRoles('SELLER'), deleteCoupon);

module.exports = router;
