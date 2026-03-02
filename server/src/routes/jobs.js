const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', jobController.getJobs);
router.get('/dashboard', jobController.getJobsWithStats);
router.get('/trades', jobController.getTrades);
router.get('/:id', jobController.getJob);
router.get('/:id/stats', jobController.getJobStats);

// Protected admin routes
router.post('/', protect, authorize('admin'), jobController.createJob);
router.put('/:id', protect, authorize('admin'), jobController.updateJob);
router.delete('/:id', protect, authorize('admin'), jobController.deleteJob);

module.exports = router;
