const prisma = require('../database/db');

const getWishlist = async (req, res) => {
  try {
    const wishlistItems = await prisma.wishlist.findMany({
      where: { buyerId: req.user.id },
      include: {
        product: {
          include: {
            category: { select: { name: true } },
            seller: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedProducts = wishlistItems.map(item => {
      const prod = item.product;
      return {
        ...prod,
        imageUrls: JSON.parse(prod.imageUrls || '[]'),
        tags: JSON.parse(prod.tags || '[]'),
        wishlistId: item.id
      };
    });

    return res.status(200).json(formattedProducts);
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const addToWishlist = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingItem = await prisma.wishlist.findUnique({
      where: {
        buyerId_productId: {
          buyerId: req.user.id,
          productId
        }
      }
    });

    if (existingItem) {
      return res.status(200).json({ message: 'Product already in wishlist' });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        buyerId: req.user.id,
        productId
      }
    });

    return res.status(201).json({
      message: 'Added to wishlist successfully',
      wishlistItem
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  try {
    const existingItem = await prisma.wishlist.findUnique({
      where: {
        buyerId_productId: {
          buyerId: req.user.id,
          productId
        }
      }
    });

    if (!existingItem) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    await prisma.wishlist.delete({
      where: {
        buyerId_productId: {
          buyerId: req.user.id,
          productId
        }
      }
    });

    return res.status(200).json({ message: 'Removed from wishlist successfully' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
