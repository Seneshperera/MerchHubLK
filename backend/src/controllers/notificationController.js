const prisma = require('../database/db');

const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const markRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.status(200).json({
      message: 'Notification marked as read',
      notification: updated
    });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getNotifications,
  markRead
};
