const prisma = require('../database/db');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
};

const getMyShop = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop details not set up yet' });
    }

    return res.status(200).json(shop);
  } catch (error) {
    console.error('Get my shop error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getPublicShopBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: 'PUBLISHED' }
        }
      }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    return res.status(200).json(shop);
  } catch (error) {
    console.error('Get public shop error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getPublicShops = async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { rating: 'desc' }
    });
    return res.status(200).json(shops);
  } catch (error) {
    console.error('Get public shops error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createOrUpdateShop = async (req, res) => {
  const { name, description, whatsapp, location, socialLinks } = req.body;

  if (!name || !description || !whatsapp || !location) {
    return res.status(400).json({ message: 'Name, description, whatsapp, and location are required' });
  }

  // Ensure seller is approved
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user.isApproved) {
    return res.status(403).json({ message: 'Forbidden: Your seller account is pending admin approval.' });
  }

  const slug = slugify(name);

  try {
    const existingShopWithSlug = await prisma.shop.findFirst({
      where: {
        slug,
        NOT: { ownerId: req.user.id }
      }
    });

    if (existingShopWithSlug) {
      return res.status(400).json({ message: 'Shop name is already taken' });
    }

    const files = req.files || {};
    const logoUrl = files.logo && files.logo[0] ? `/uploads/${files.logo[0].filename}` : null;
    const bannerUrl = files.banner && files.banner[0] ? `/uploads/${files.banner[0].filename}` : null;

    const existingShop = await prisma.shop.findUnique({
      where: { ownerId: req.user.id }
    });

    let shop;
    if (existingShop) {
      // Update
      const data = {
        name,
        slug,
        description,
        whatsapp,
        location,
        socialLinks: socialLinks || existingShop.socialLinks
      };

      if (logoUrl) data.logoUrl = logoUrl;
      if (bannerUrl) data.bannerUrl = bannerUrl;

      shop = await prisma.shop.update({
        where: { ownerId: req.user.id },
        data
      });
    } else {
      // Create
      shop = await prisma.shop.create({
        data: {
          name,
          slug,
          description,
          ownerId: req.user.id,
          whatsapp,
          location,
          socialLinks: socialLinks || '[]',
          logoUrl: logoUrl || '/uploads/default-logo.png',
          bannerUrl: bannerUrl || '/uploads/default-banner.png'
        }
      });
    }

    return res.status(200).json({
      message: 'Shop updated successfully',
      shop
    });
  } catch (error) {
    console.error('Create/Update shop error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Phase 2: Seller analytics dashboard data
const getShopAnalytics = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Get all orders that are NOT CANCELLED
    const orders = await prisma.order.findMany({
      where: {
        sellerId: shop.id,
        NOT: { status: 'CANCELLED' }
      },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true } }
          }
        }
      }
    });

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate top products
    const productSalesMap = {};
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const prodName = item.product?.name || 'Unknown Item';
        if (!productSalesMap[prodName]) {
          productSalesMap[prodName] = { name: prodName, quantity: 0, revenue: 0 };
        }
        productSalesMap[prodName].quantity += item.quantity;
        productSalesMap[prodName].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Low stock warnings
    const lowStockProducts = await prisma.product.findMany({
      where: {
        sellerId: shop.id,
        stock: { lt: 5 }, // Low stock threshold
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        name: true,
        stock: true,
        sku: true
      }
    });

    return res.status(200).json({
      totalOrders,
      totalSales,
      averageOrderValue,
      topProducts,
      lowStockProducts
    });
  } catch (error) {
    console.error('Get shop analytics error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getMyShop,
  getPublicShopBySlug,
  getPublicShops,
  createOrUpdateShop,
  getShopAnalytics
};
