const prisma = require('../database/db');

const getContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all users who either sent a message to current user or received one
    const sentTo = await prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true }
    });

    const receivedFrom = await prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true }
    });

    const contactIds = Array.from(new Set([
      ...sentTo.map(m => m.receiverId),
      ...receivedFrom.map(m => m.senderId)
    ]));

    const contacts = await prisma.user.findMany({
      where: { id: { in: contactIds } },
      select: {
        id: true,
        email: true,
        role: true,
        shop: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    return res.status(200).json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getThread = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Get message thread error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  if (!receiverId || !content) {
    return res.status(400).json({ message: 'ReceiverId and content are required' });
  }

  try {
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({ message: 'Recipient user not found' });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content
      }
    });

    // Create a persistent notification for the recipient
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        message: `You received a new message from ${req.user.email}.`
      }
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getContacts,
  getThread,
  sendMessage
};
