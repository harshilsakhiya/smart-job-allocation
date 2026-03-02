const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/contractor/register', authController.registerContractor);
router.post('/contractor/login', authController.loginContractor);
router.post('/admin/login', authController.loginAdmin);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authorize('contractor'), authController.updateProfile);

module.exports = router;
