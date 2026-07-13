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
    .replace(/-+$/, '') + '-' + Math.floor(1000 + Math.random() * 9000); // Append random suffix to keep unique
};

const getProducts = async (req, res) => {
  const { category, search, seller } = req.query;

  try {
    const where = { status: 'PUBLISHED' };

    if (category) {
      where.category = { slug: category };
    }

    if (seller) {
      where.seller = { slug: seller };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { name: true, slug: true }
        },
        seller: {
          select: { name: true, slug: true, logoUrl: true, whatsapp: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Parse image URLs and tags JSON strings
    const formattedProducts = products.map(product => ({
      ...product,
      imageUrls: JSON.parse(product.imageUrls || '[]'),
      tags: JSON.parse(product.tags || '[]')
    }));

    return res.status(200).json(formattedProducts);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getMyShopProducts = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop details not found. Please create a shop first.' });
    }

    const products = await prisma.product.findMany({
      where: { sellerId: shop.id },
      include: {
        category: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedProducts = products.map(product => ({
      ...product,
      imageUrls: JSON.parse(product.imageUrls || '[]'),
      tags: JSON.parse(product.tags || '[]')
    }));

    return res.status(200).json(formattedProducts);
  } catch (error) {
    console.error('Get shop products error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getProductBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        seller: {
          select: { id: true, name: true, slug: true, logoUrl: true, whatsapp: true, description: true, location: true, ownerId: true }
        }

      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const formattedProduct = {
      ...product,
      imageUrls: JSON.parse(product.imageUrls || '[]'),
      tags: JSON.parse(product.tags || '[]')
    };

    return res.status(200).json(formattedProduct);
  } catch (error) {
    console.error('Get product by slug error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createProduct = async (req, res) => {
  const { name, description, price, discount, categoryId, stock, sku, tags, status } = req.body;

  if (!name || !description || !price || !categoryId || stock === undefined || !sku) {
    return res.status(400).json({ message: 'Name, description, price, categoryId, stock, and SKU are required' });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop details not found. Set up your shop before uploading products.' });
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingSku) {
      return res.status(400).json({ message: 'Product SKU must be unique' });
    }

    const slug = slugify(name);

    // Process files
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    } else {
      imageUrls = ['/uploads/default-product.png'];
    }

    const parsedPrice = parseFloat(price);
    const parsedDiscount = discount ? parseFloat(discount) : 0.0;
    const parsedStock = parseInt(stock);

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parsedPrice,
        discount: parsedDiscount,
        categoryId,
        sellerId: shop.id,
        imageUrls: JSON.stringify(imageUrls),
        stock: parsedStock,
        sku,
        tags: tags || '[]',
        status: status || 'PUBLISHED'
      }
    });

    // Create inventory log
    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        change: parsedStock,
        type: 'MANUAL_ADJUSTMENT'
      }
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product: {
        ...product,
        imageUrls,
        tags: JSON.parse(tags || '[]')
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, discount, categoryId, stock, sku, tags, status } = req.body;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Authorization: ensure seller owns product
    if (product.seller.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this product' });
    }

    if (sku && sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku }
      });
      if (existingSku) {
        return res.status(400).json({ message: 'Product SKU must be unique' });
      }
    }

    const data = {};
    if (name) {
      data.name = name;
      data.slug = slugify(name);
    }
    if (description) data.description = description;
    if (price) data.price = parseFloat(price);
    if (discount !== undefined) data.discount = parseFloat(discount);
    if (categoryId) data.categoryId = categoryId;
    if (sku) data.sku = sku;
    if (tags) data.tags = tags;
    if (status) data.status = status;

    // Handle new stock level
    if (stock !== undefined) {
      const parsedStock = parseInt(stock);
      const difference = parsedStock - product.stock;
      
      data.stock = parsedStock;

      if (difference !== 0) {
        await prisma.inventoryLog.create({
          data: {
            productId: product.id,
            change: difference,
            type: 'MANUAL_ADJUSTMENT'
          }
        });
      }
    }

    // Handle images
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
      data.imageUrls = JSON.stringify(imageUrls);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data
    });

    return res.status(200).json({
      message: 'Product updated successfully',
      product: {
        ...updatedProduct,
        imageUrls: JSON.parse(updatedProduct.imageUrls || '[]'),
        tags: JSON.parse(updatedProduct.tags || '[]')
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Authorization
    if (product.seller.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this product' });
    }

    await prisma.product.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getProducts,
  getMyShopProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct
};
