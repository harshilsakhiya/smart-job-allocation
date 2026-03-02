const express = require('express');
const router = express.Router();
const zipController = require('../controllers/zipController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', zipController.getZipCodesByScoreRange);
router.get('/top', zipController.getTopZipCodes);
router.get('/stats', zipController.getZipStatistics);
router.get('/:zipCode', zipController.getZipIntelligence);
router.get('/:zipCode/breakdown', zipController.getScoreBreakdown);
router.post('/compare', zipController.compareZipCodes);

// Protected admin routes
router.put('/:zipCode', protect, authorize('admin'), zipController.updateZipScores);
router.post('/batch-update', protect, authorize('admin'), zipController.batchUpdateZipScores);
router.post('/seed', protect, authorize('admin'), zipController.seedZipData);

module.exports = router;
