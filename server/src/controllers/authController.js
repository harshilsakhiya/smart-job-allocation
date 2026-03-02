const jwt = require('jsonwebtoken');
const Contractor = require('../models/Contractor');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * @desc    Register new contractor
 * @route   POST /api/auth/contractor/register
 * @access  Public
 */
exports.registerContractor = async (req, res) => {
  try {
    const { email, password, name, phone, trades, zipCode, coordinates, address } = req.body;

    // Check if contractor exists
    const existingContractor = await Contractor.findOne({ email });
    if (existingContractor) {
      return res.status(400).json({
        success: false,
        message: 'Contractor already exists with this email'
      });
    }

    // Create contractor
    const contractor = await Contractor.create({
      email,
      password,
      profile: {
        name,
        phone,
        trades: trades || [],
        location: {
          zipCode,
          coordinates: coordinates || [0, 0],
          address
        }
      }
    });

    // Generate token
    const token = generateToken(contractor._id);

    res.status(201).json({
      success: true,
      message: 'Contractor registered successfully',
      data: {
        token,
        user: {
          id: contractor._id,
          email: contractor.email,
          name: contractor.profile.name,
          role: 'contractor'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering contractor',
      error: error.message
    });
  }
};

/**
 * @desc    Login contractor
 * @route   POST /api/auth/contractor/login
 * @access  Public
 */
exports.loginContractor = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, passwordProvided: !!password });

    // Check for contractor
    const contractor = await Contractor.findOne({ email }).select('+password');
    if (!contractor) {
      console.log('Contractor not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('Contractor found:', contractor.email, 'isActive:', contractor.isActive);

    // Check password
    const isMatch = await contractor.comparePassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if active
    if (!contractor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate token
    const token = generateToken(contractor._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: contractor._id,
          email: contractor.email,
          name: contractor.profile.name,
          role: 'contractor',
          metrics: contractor.metrics
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    // Check if admin
    if (req.user.role === 'admin') {
      return res.json({
        success: true,
        data: {
          id: req.user.id,
          email: 'admin@smartjob.com',
          role: 'admin'
        }
      });
    }

    // Otherwise, get contractor
    const contractor = await Contractor.findById(req.user.id);

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: contractor._id,
        email: contractor.email,
        profile: contractor.profile,
        metrics: contractor.metrics,
        role: 'contractor'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

/**
 * @desc    Update contractor profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, trades, zipCode, coordinates, address } = req.body;

    const contractor = await Contractor.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'profile.name': name,
          'profile.phone': phone,
          'profile.trades': trades,
          'profile.location.zipCode': zipCode,
          'profile.location.coordinates': coordinates,
          'profile.location.address': address
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: contractor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Simple admin authentication (in production, use proper admin model)
const ADMIN_CREDENTIALS = {
  email: 'admin@smartjob.com',
  password: 'admin123' // In production, hash this
};

/**
 * @desc    Admin login
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple admin check (replace with proper admin model in production)
    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Generate admin token
    const token = jwt.sign(
      { id: 'admin', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          id: 'admin',
          email: ADMIN_CREDENTIALS.email,
          role: 'admin'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};
