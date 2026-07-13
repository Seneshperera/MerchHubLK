const express = require('express');
const { createOrder, getBuyerOrders, getSellerOrders, updateOrderStatus, trackOrder } = require('../controllers/orderController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();

// Public route for tracking orders
router.get('/track/:id', trackOrder);

router.use(authenticateJWT);


router.post('/', authorizeRoles('BUYER'), createOrder);
router.get('/buyer', authorizeRoles('BUYER'), getBuyerOrders);
router.get('/seller', authorizeRoles('SELLER'), getSellerOrders);
router.patch('/:id/status', authorizeRoles('SELLER'), updateOrderStatus);

module.exports = router;
