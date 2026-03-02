const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/job/:jobId', bidController.getBidsForJob);
router.get('/job/:jobId/ranking-stats', bidController.getRankingStats);

// Protected contractor routes
router.post('/', protect, authorize('contractor'), bidController.submitBid);
router.put('/:id', protect, authorize('contractor'), bidController.updateBid);
router.delete('/:id', protect, authorize('contractor'), bidController.deleteBid);
router.get('/my-bids', protect, authorize('contractor'), bidController.getMyBids);
router.delete('/:id', protect, authorize('contractor'), bidController.withdrawBid);

// Protected admin routes
router.post('/:id/accept', protect, authorize('admin'), bidController.acceptBid);
router.post('/:id/reject', protect, authorize('admin'), bidController.rejectBid);
router.patch('/:id/override', protect, authorize('admin'), bidController.overrideRanking);
router.delete('/:id/override', protect, authorize('admin'), bidController.removeOverride);

module.exports = router;
