const express = require('express');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.get('/', getCategories);

// Admin-only category management
router.post('/', authenticateJWT, authorizeRoles('ADMIN'), upload.single('image'), createCategory);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN'), upload.single('image'), updateCategory);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), deleteCategory);

module.exports = router;
