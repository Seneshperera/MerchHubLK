const prisma = require('../database/db');

const createCheckoutSession = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'OrderId is required' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only PENDING orders can be checked out' });
    }

    // Return mock Stripe Checkout URL pointing to our frontend simulator
    const redirectUrl = `http://localhost:3000/payment-simulator?orderId=${order.id}`;
    
    return res.status(200).json({ url: redirectUrl });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const confirmPayment = async (req, res) => {
  const { orderId, transactionId, status } = req.body;

  if (!orderId || !transactionId || !status) {
    return res.status(400).json({ message: 'OrderId, transactionId, and status are required' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status.toUpperCase() === 'SUCCESS') {
      // Avoid double processing
      if (order.status !== 'PENDING') {
        return res.status(200).json({ message: 'Order was already processed', order });
      }

      // 1. Calculate 10% platform commission and 90% net earnings
      const commission = order.totalAmount * 0.10;
      const netEarnings = order.totalAmount * 0.90;

      // Execute database update in transaction
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // 2. Update order status to CONFIRMED
        const ord = await tx.order.update({
          where: { id: orderId },
          data: { status: 'CONFIRMED' }
        });

        // 3. Credit Seller Wallet
        await tx.shop.update({
          where: { id: order.sellerId },
          data: {
            walletBalance: { increment: netEarnings }
          }
        });

        return ord;
      });

      // Get seller owner details to send notification
      const shop = await prisma.shop.findUnique({
        where: { id: order.sellerId }
      });

      // 4. Notification to Seller
      await prisma.notification.create({
        data: {
          userId: shop.ownerId,
          type: 'ORDER_UPDATE',
          message: `Payment received for Order #${order.id.slice(0, 8)}. Net LKR ${netEarnings.toFixed(2)} (after 10% commission of LKR ${commission.toFixed(2)}) has been credited to your Wallet.`
        }
      });

      // 5. Notification to Buyer
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'ORDER_UPDATE',
          message: `Your payment was verified successfully for Order #${order.id.slice(0, 8)}. Order status updated to CONFIRMED.`
        }
      });

      return res.status(200).json({
        message: 'Payment confirmed and seller wallet credited.',
        order: updatedOrder
      });
    } else {
      // Payment Failed
      return res.status(400).json({ message: 'Stripe payment transaction failed verification.' });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createCheckoutSession,
  confirmPayment
};
