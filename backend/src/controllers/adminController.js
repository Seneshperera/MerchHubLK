const prisma = require('../database/db');

const getSellers = async (req, res) => {
  try {
    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      select: {
        id: true,
        email: true,
        isApproved: true,
        createdAt: true,
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            whatsapp: true,
            isFeatured: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(sellers);
  } catch (error) {
    console.error('Get sellers error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const approveSeller = async (req, res) => {
  const { id } = req.params;

  try {
    const seller = await prisma.user.findUnique({
      where: { id }
    });

    if (!seller || seller.role !== 'SELLER') {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isApproved: true },
      select: { id: true, email: true, isApproved: true }
    });

    // Create a notification for the seller
    await prisma.notification.create({
      data: {
        userId: id,
        type: 'ORDER_UPDATE',
        message: 'Your seller account has been approved by the Administrator. You can now setup your shop!',
      }
    });

    return res.status(200).json({
      message: 'Seller approved successfully',
      seller: updatedUser
    });
  } catch (error) {
    console.error('Approve seller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const rejectSeller = async (req, res) => {
  const { id } = req.params;

  try {
    const seller = await prisma.user.findUnique({
      where: { id }
    });

    if (!seller || seller.role !== 'SELLER') {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isApproved: false },
      select: { id: true, email: true, isApproved: true }
    });

    return res.status(200).json({
      message: 'Seller disapproved/rejected successfully',
      seller: updatedUser
    });
  } catch (error) {
    console.error('Reject seller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Phase 2: Feature toggles & Moderation
const toggleShopFeatured = async (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop storefront not found' });
    }

    const updated = await prisma.shop.update({
      where: { id },
      data: { isFeatured: !!isFeatured }
    });

    return res.status(200).json({
      message: `Shop feature status updated successfully`,
      shop: updated
    });
  } catch (error) {
    console.error('Toggle shop featured error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const toggleProductFeatured = async (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;

  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isFeatured: !!isFeatured }
    });

    return res.status(200).json({
      message: `Product feature status updated successfully`,
      product: updated
    });
  } catch (error) {
    console.error('Toggle product featured error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        seller: { select: { name: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = products.map(p => ({
      ...p,
      imageUrls: JSON.parse(p.imageUrls || '[]'),
      tags: JSON.parse(p.tags || '[]')
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Get admin products error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProductStatusModerated = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status?.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid product status' });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { status: status.toUpperCase() }
    });

    return res.status(200).json({
      message: 'Product status modified by Administrator',
      product: updated
    });
  } catch (error) {
    console.error('Moderator status update error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteProductModerated = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Product deleted by Administrator successfully' });
  } catch (error) {
    console.error('Moderator product deletion error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSellers,
  approveSeller,
  rejectSeller,
  toggleShopFeatured,
  toggleProductFeatured,
  getAdminProducts,
  updateProductStatusModerated,
  deleteProductModerated
};
