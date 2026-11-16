const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || 'supersecretjwtkey_auth_dev_key',
    {
      expiresIn: process.env.JWT_EXPIRE || '1h'
    }
  );
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id, user.email, user.role);

  const cookieExpireDays = parseInt(process.env.COOKIE_EXPIRE, 10) || 1;
  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with that email already exists.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    sendTokenResponse(user, 201, res, 'User registered successfully.');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during registration.'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email }, '+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    sendTokenResponse(user, 200, res, 'Logged in successfully.');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during login.'
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Protected profile data accessed successfully.',
      user: req.user,
      tokenPayload: req.tokenPayload
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving profile.'
    });
  }
};

exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully.'
  });
};
