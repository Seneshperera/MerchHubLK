const prisma = require('../database/db');

const createOrder = async (req, res) => {
  const { sellerId, shippingAddress, customerDetails, paymentMethod, items, couponCode } = req.body;

  if (!sellerId || !shippingAddress || !customerDetails || !paymentMethod || !items || items.length === 0) {
    return res.status(400).json({ message: 'All order fields (sellerId, shippingAddress, customerDetails, paymentMethod, items) are required' });
  }

  const validPaymentMethods = ['COD', 'WHATSAPP', 'STRIPE_SIM'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method' });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: sellerId },
      include: { owner: true }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Seller shop not found' });
    }

    // Process and calculate totals while validating stock
    let subtotal = 0;
    const orderItemsData = [];
    const stockUpdates = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({ message: `Product not found (ID: ${item.productId})` });
      }

      if (product.sellerId !== sellerId) {
        return res.status(400).json({ message: `Product ${product.name} does not belong to the selected shop` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}` });
      }

      const unitPrice = product.price * (1 - (product.discount / 100));
      subtotal += unitPrice * item.quantity;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: unitPrice,
        productName: product.name,
        productSku: product.sku
      });

      stockUpdates.push({
        id: product.id,
        newStock: product.stock - item.quantity,
        change: -item.quantity
      });
    }

    // Validate Coupon if provided
    let discountAmount = 0;
    if (couponCode) {
      const normalizedCode = couponCode.toUpperCase().trim();
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode }
      });

      if (coupon && coupon.isActive && new Date(coupon.expiryDate) > new Date()) {
        if (!coupon.sellerId || coupon.sellerId === sellerId) {
          if (subtotal >= coupon.minimumOrderAmount) {
            if (coupon.discountType === 'PERCENTAGE') {
              discountAmount = subtotal * (coupon.value / 100);
            } else {
              discountAmount = coupon.value;
            }
            discountAmount = Math.min(discountAmount, subtotal); // Cap to avoid negative total
          }
        }
      }
    }

    const totalAmount = subtotal - discountAmount;

    // Execute database transaction to create order and update stocks
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the Order
      const newOrder = await tx.order.create({
        data: {
          buyerId: req.user.id,
          sellerId: sellerId,
          totalAmount: totalAmount,
          shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
          customerDetails: typeof customerDetails === 'string' ? customerDetails : JSON.stringify(customerDetails),
          paymentMethod: paymentMethod,
          status: 'PENDING'
        }
      });

      // 2. Create Order Items
      for (const item of orderItemsData) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }
        });
      }

      // 3. Update stock levels and write inventory logs
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.id },
          data: { stock: update.newStock }
        });

        await tx.inventoryLog.create({
          data: {
            productId: update.id,
            change: update.change,
            type: 'ORDER'
          }
        });
      }

      return newOrder;
    });

    // Generate WhatsApp link metadata if payment method is WhatsApp
    let whatsappUrl = null;
    if (paymentMethod === 'WHATSAPP') {
      const buyerName = customerDetails.fullName || customerDetails.name || 'Customer';
      const buyerPhone = customerDetails.phoneNumber || customerDetails.phone || '';
      const addressString = typeof shippingAddress === 'string' 
        ? shippingAddress 
        : `${shippingAddress.addressLine1}, ${shippingAddress.city}`;

      let itemsText = orderItemsData.map(item => `- ${item.productName} (x${item.quantity})`).join('\n');
      
      let couponInfo = couponCode && discountAmount > 0 
        ? `\n*Coupon Discount:* -LKR ${discountAmount.toFixed(2)} (${couponCode})`
        : '';

      const whatsappText = `Hello! I would like to order the following from your shop, MerchHub LK:\n\n` +
        `*Order ID:* ${order.id}\n` +
        `*Products:*\n${itemsText}\n\n` +
        `*Subtotal:* LKR ${subtotal.toFixed(2)}${couponInfo}\n` +
        `*Total Amount:* LKR ${totalAmount.toFixed(2)}\n\n` +
        `*Delivery Details:*\n` +
        `- *Name:* ${buyerName}\n` +
        `- *Phone:* ${buyerPhone}\n` +
        `- *Address:* ${addressString}\n\n` +
        `Please confirm my order. Thank you!`;

      let targetPhone = shop.whatsapp;
      if (targetPhone) {
        let cleanedPhone = targetPhone.replace(/[^\d]/g, '');
        if (!cleanedPhone.startsWith('94') && cleanedPhone.length === 9) {
          cleanedPhone = '94' + cleanedPhone;
        }
        
        whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(whatsappText)}`;
      }

    }

    // Create notification for Seller
    await prisma.notification.create({
      data: {
        userId: shop.ownerId,
        type: 'NEW_ORDER',
        message: `You received a new order (${paymentMethod}) from ${customerDetails.fullName || 'a customer'} for LKR ${totalAmount.toFixed(2)}.`
      }
    });

    return res.status(201).json({
      message: 'Order created successfully',
      order,
      whatsappUrl
    });

  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getBuyerOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user.id },
      include: {
        seller: {
          select: { name: true, logoUrl: true, whatsapp: true }
        },
        orderItems: {
          include: {
            product: {
              select: { name: true, imageUrls: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedOrders = orders.map(order => ({
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress || '{}'),
      customerDetails: JSON.parse(order.customerDetails || '{}'),
      orderItems: order.orderItems.map(item => ({
        ...item,
        product: {
          ...item.product,
          imageUrls: JSON.parse(item.product.imageUrls || '[]')
        }
      }))
    }));

    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Get buyer orders error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getSellerOrders = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop details not found.' });
    }

    const orders = await prisma.order.findMany({
      where: { sellerId: shop.id },
      include: {
        buyer: {
          select: { email: true }
        },
        orderItems: {
          include: {
            product: {
              select: { name: true, imageUrls: true, sku: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedOrders = orders.map(order => ({
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress || '{}'),
      customerDetails: JSON.parse(order.customerDetails || '{}'),
      orderItems: order.orderItems.map(item => ({
        ...item,
        product: {
          ...item.product,
          imageUrls: JSON.parse(item.product.imageUrls || '[]')
        }
      }))
    }));

    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Get seller orders error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const newStatusUpper = status.toUpperCase();

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization
    if (order.seller.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this shop' });
    }

    const currentStatus = order.status;

    // Transaction updates for Status & Wallet Adjustments
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. If transitioning to CONFIRMED or DELIVERED, and was PENDING:
      // (This handles COD and WhatsApp commission credits)
      if ((newStatusUpper === 'CONFIRMED' || newStatusUpper === 'DELIVERED') && (currentStatus === 'PENDING')) {
        const netEarnings = order.totalAmount * 0.90;
        await tx.shop.update({
          where: { id: order.sellerId },
          data: {
            walletBalance: { increment: netEarnings }
          }
        });
      }

      // 2. If transitioning to CANCELLED, and was CONFIRMED or DELIVERED:
      // (This handles reversing previous credits)
      if (newStatusUpper === 'CANCELLED' && (currentStatus === 'CONFIRMED' || currentStatus === 'DELIVERED')) {
        const netEarnings = order.totalAmount * 0.90;
        await tx.shop.update({
          where: { id: order.sellerId },
          data: {
            walletBalance: { decrement: netEarnings }
          }
        });
      }

      // 3. Perform actual order status update
      return await tx.order.update({
        where: { id },
        data: { status: newStatusUpper }
      });
    });

    // Create notification for Buyer
    await prisma.notification.create({
      data: {
        userId: order.buyerId,
        type: 'ORDER_UPDATE',
        message: `Your order #${order.id.slice(0, 8)} status has been updated to ${newStatusUpper} by ${order.seller.name}.`
      }
    });

    // If transitioning to CANCELLED, return stock to product
    if (newStatusUpper === 'CANCELLED' && currentStatus !== 'CANCELLED') {
      const items = await prisma.orderItem.findMany({
        where: { orderId: order.id }
      });

      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity }
          }
        });

        await prisma.inventoryLog.create({
          data: {
            productId: item.productId,
            change: item.quantity,
            type: 'RETURN'
          }
        });
      }
    }

    return res.status(200).json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const trackOrder = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: id },
          { id: { startsWith: id } }
        ]
      },
      include: {
        seller: {
          select: { name: true, logoUrl: true, whatsapp: true }
        },
        orderItems: {
          include: {
            product: {
              select: { name: true, imageUrls: true }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found. Please verify your Order ID.' });
    }

    const sanitizedOrder = {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      sellerName: order.seller.name,
      sellerLogo: order.seller.logoUrl,
      sellerWhatsapp: order.seller.whatsapp,
      items: order.orderItems.map(item => ({
        name: item.productName || item.product?.name || 'Item',
        quantity: item.quantity,
        price: item.price,
        imageUrls: JSON.parse(item.product?.imageUrls || '[]')
      }))
    };

    return res.status(200).json(sanitizedOrder);
  } catch (error) {
    console.error('Track order error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  updateOrderStatus,
  trackOrder
};

