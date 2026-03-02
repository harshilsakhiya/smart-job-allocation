const jwt = require('jsonwebtoken');
const Contractor = require('../models/Contractor');

/**
 * Protect routes - Verify JWT token
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin token
    if (decoded.role === 'admin') {
      req.user = { id: 'admin', role: 'admin' };
      return next();
    }

    // Check if contractor exists
    const contractor = await Contractor.findById(decoded.id);
    if (!contractor) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if contractor is active
    if (!contractor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = {
      id: contractor._id,
      email: contractor.email,
      role: 'contractor'
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

/**
 * Authorize specific roles
 * @param  {...String} roles - Allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
