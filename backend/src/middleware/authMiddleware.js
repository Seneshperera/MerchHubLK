const jwt = require('jsonwebtoken');
const prisma = require('../database/db');

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer <token>

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'merchhub_lk_secret_key_12345');
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found or deleted' });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    }
  } else {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles,
};
