const prisma = require('../database/db');

const getProductReviews = async (req, res) => {
  const { productId } = req.params;

  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        buyer: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createReview = async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  const parsedRating = parseInt(rating);
  if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ message: 'Rating is required and must be between 1 and 5' });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        buyerId: req.user.id,
        rating: parsedRating,
        comment: comment || ''
      }
    });

    // Recalculate product rating
    const allProductReviews = await prisma.review.findMany({
      where: { productId }
    });

    const avgProductRating = allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: { rating: avgProductRating }
    });

    // Recalculate shop rating
    const shopProducts = await prisma.product.findMany({
      where: { sellerId: product.sellerId },
      select: { rating: true }
    });

    // Only count products that have been rated (rating > 0)
    const ratedProducts = shopProducts.filter(p => p.rating > 0);
    const avgShopRating = ratedProducts.length > 0
      ? ratedProducts.reduce((sum, p) => sum + p.rating, 0) / ratedProducts.length
      : 0;

    await prisma.shop.update({
      where: { id: product.sellerId },
      data: { rating: avgShopRating }
    });

    return res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getProductReviews,
  createReview
};
