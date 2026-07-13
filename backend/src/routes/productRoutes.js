const express = require('express');
const { getProducts, getMyShopProducts, getProductBySlug, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/details/:slug', getProductBySlug);

// Seller-only routes
router.get('/my-products', authenticateJWT, authorizeRoles('SELLER'), getMyShopProducts);
router.post('/', authenticateJWT, authorizeRoles('SELLER'), upload.array('images', 5), createProduct);
router.put('/:id', authenticateJWT, authorizeRoles('SELLER'), upload.array('images', 5), updateProduct);
router.delete('/:id', authenticateJWT, authorizeRoles('SELLER'), deleteProduct);

// Authenticated file upload endpoint for customization designs
router.post('/upload-design', authenticateJWT, upload.single('designImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No design image uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  return res.status(200).json({ imageUrl });
});


module.exports = router;

