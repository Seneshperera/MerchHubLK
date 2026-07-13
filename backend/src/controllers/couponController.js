const prisma = require('../database/db');

const getCoupons = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop details not found.' });
    }

    const coupons = await prisma.coupon.findMany({
      where: { sellerId: shop.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createCoupon = async (req, res) => {
  const { code, discountType, value, minimumOrderAmount, expiryDate } = req.body;

  if (!code || !discountType || !value || !minimumOrderAmount || !expiryDate) {
    return res.status(400).json({ message: 'All coupon fields (code, discountType, value, minimumOrderAmount, expiryDate) are required' });
  }

  if (!['PERCENTAGE', 'FIXED_AMOUNT'].includes(discountType)) {
    return res.status(400).json({ message: 'Invalid discount type. Must be PERCENTAGE or FIXED_AMOUNT' });
  }

  const normalizedCode = code.toUpperCase().trim();

  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop details not found. Setup your shop first.' });
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode }
    });

    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon with this code already exists' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        discountType,
        value: parseFloat(value),
        minimumOrderAmount: parseFloat(minimumOrderAmount),
        expiryDate: new Date(expiryDate),
        sellerId: shop.id
      }
    });

    return res.status(201).json({
      message: 'Coupon created successfully',
      coupon
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Authorization
    if (coupon.seller && coupon.seller.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this shop' });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const validateCoupon = async (req, res) => {
  const { code, sellerId, orderAmount } = req.body;

  if (!code || !sellerId || !orderAmount) {
    return res.status(400).json({ message: 'Code, sellerId, and orderAmount are required' });
  }

  const normalizedCode = code.toUpperCase().trim();

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode }
    });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ message: 'Invalid or inactive coupon code' });
    }

    // Check expiration
    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'This coupon code has expired' });
    }

    // Check seller
    if (coupon.sellerId && coupon.sellerId !== sellerId) {
      return res.status(400).json({ message: 'This coupon cannot be used for this shop' });
    }

    // Check order minimum amount
    const parsedAmount = parseFloat(orderAmount);
    if (parsedAmount < coupon.minimumOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount of LKR ${coupon.minimumOrderAmount.toLocaleString()} is required for this coupon` });
    }

    // Calculate discount
    let discountVal = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountVal = parsedAmount * (coupon.value / 100);
    } else {
      discountVal = coupon.value;
    }

    // Cap discount value to avoid negative total
    const finalDiscount = Math.min(discountVal, parsedAmount);
    const newTotal = parsedAmount - finalDiscount;

    return res.status(200).json({
      message: 'Coupon is valid',
      discountType: coupon.discountType,
      value: coupon.value,
      discountAmount: finalDiscount,
      newTotal
    });

  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  deleteCoupon,
  validateCoupon
};
