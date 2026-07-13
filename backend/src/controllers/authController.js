const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../database/db');

const register = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'All fields (email, password, role) are required' });
  }

  const normalizedRole = role.toUpperCase();
  if (!['BUYER', 'SELLER', 'ADMIN'].includes(normalizedRole)) {
    return res.status(400).json({ message: 'Invalid role. Must be BUYER, SELLER, or ADMIN' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isApproved = normalizedRole !== 'SELLER'; // Sellers need admin approval, others are true by default

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: normalizedRole,
        isApproved,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'merchhub_lk_secret_key_12345', {
      expiresIn: '1d', // 1 day for easier testing
    });

    return res.status(200).json({
      message: 'Login successful',
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
};
