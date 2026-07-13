const express = require('express');
const { getMyShop, getPublicShopBySlug, getPublicShops, createOrUpdateShop, getShopAnalytics } = require('../controllers/sellerController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

// Public routes
router.get('/public', getPublicShops);
router.get('/public/:slug', getPublicShopBySlug);

// Seller-only routes
router.get('/my-shop', authenticateJWT, authorizeRoles('SELLER'), getMyShop);
router.post('/setup', authenticateJWT, authorizeRoles('SELLER'), upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), createOrUpdateShop);

// Phase 2: Seller Analytics
router.get('/analytics', authenticateJWT, authorizeRoles('SELLER'), getShopAnalytics);

module.exports = router;
