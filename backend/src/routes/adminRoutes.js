const express = require('express');
const { 
  getSellers, 
  approveSeller, 
  rejectSeller,
  toggleShopFeatured,
  toggleProductFeatured,
  getAdminProducts,
  updateProductStatusModerated,
  deleteProductModerated
} = require('../controllers/adminController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authenticateJWT);
router.use(authorizeRoles('ADMIN'));

router.get('/sellers', getSellers);
router.patch('/sellers/:id/approve', approveSeller);
router.patch('/sellers/:id/reject', rejectSeller);

// Phase 2: Moderation & Features
router.patch('/shops/:id/featured', toggleShopFeatured);
router.patch('/products/:id/featured', toggleProductFeatured);
router.get('/products', getAdminProducts);
router.patch('/products/:id/status', updateProductStatusModerated);
router.delete('/products/:id', deleteProductModerated);

module.exports = router;
