const Bid = require('../models/Bid');
const Job = require('../models/Job');
const Contractor = require('../models/Contractor');
const { calculateAndUpdateRankings, recalculateAfterOverride, getRankingStats } = require('../services/rankingService');
const { getRankedBidsPipeline, getBidStatsPipeline } = require('../aggregations/bidAggregations');

/**
 * @desc    Submit a new bid
 * @route   POST /api/bids
 * @access  Private (Contractor)
 */
exports.submitBid = async (req, res) => {
  try {
    const { jobId, amount, estimatedDays, message } = req.body;
    const contractorId = req.user.id;

    // Check if job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Job is no longer accepting bids'
      });
    }

    // Check if contractor already bid
    const canBid = await Bid.canBid(jobId, contractorId);
    if (!canBid) {
      return res.status(400).json({
        success: false,
        message: 'You have already placed a bid on this job'
      });
    }

    // Create bid
    const bid = await Bid.create({
      jobId,
      contractorId,
      amount,
      estimatedDays,
      message
    });

    // Calculate and update rankings for all bids on this job
    const rankedBids = await calculateAndUpdateRankings(jobId);

    // Find the submitted bid with its new ranking
    const submittedBid = rankedBids.find(b => b._id.toString() === bid._id.toString());

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      data: submittedBid || bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting bid',
      error: error.message
    });
  }
};

/**
 * @desc    Get ranked bids for a job
 * @route   GET /api/bids/job/:jobId
 * @access  Public
 */
exports.getBidsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const pipeline = getRankedBidsPipeline(jobId, {
      excludeRejected: false,
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    });

    const bids = await Bid.aggregate(pipeline);

    // Get stats
    const [stats] = await Bid.aggregate(getBidStatsPipeline(jobId));

    res.json({
      success: true,
      data: bids,
      stats: stats || {
        totalBids: 0,
        pendingBids: 0,
        acceptedBids: 0,
        rejectedBids: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bids',
      error: error.message
    });
  }
};

/**
 * @desc    Get contractor's bids
 * @route   GET /api/bids/my-bids
 * @access  Private (Contractor)
 */
exports.getMyBids = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const contractorId = req.user.id;

    const query = { contractorId };
    if (status) query.status = status;

    const bids = await Bid.find(query)
      .populate('jobId', 'title zipCode trade status isUrgent')
      .sort({ submittedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Bid.countDocuments(query);

    res.json({
      success: true,
      data: bids,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your bids',
      error: error.message
    });
  }
};

/**
 * @desc    Accept a bid
 * @route   POST /api/bids/:id/accept
 * @access  Private (Admin)
 */
exports.acceptBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Bid is already ${bid.status}`
      });
    }

    await bid.accept(req.user.id);

    res.json({
      success: true,
      message: 'Bid accepted successfully',
      data: bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting bid',
      error: error.message
    });
  }
};

/**
 * @desc    Reject a bid
 * @route   POST /api/bids/:id/reject
 * @access  Private (Admin)
 */
exports.rejectBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Bid is already ${bid.status}`
      });
    }

    await bid.reject();

    res.json({
      success: true,
      message: 'Bid rejected successfully',
      data: bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting bid',
      error: error.message
    });
  }
};

/**
 * @desc    Override bid ranking (Admin)
 * @route   PATCH /api/bids/:id/override
 * @access  Private (Admin)
 */
exports.overrideRanking = async (req, res) => {
  try {
    const { newRank, reason } = req.body;
    const bidId = req.params.id;

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    const originalRank = bid.ranking.rank;

    // Update the bid with override info
    bid.adminOverride = {
      isOverridden: true,
      overriddenBy: req.user.id,
      overriddenAt: new Date(),
      originalRank,
      newRank,
      reason
    };

    bid.ranking.rank = newRank;
    await bid.save();

    // Recalculate ranks for other bids
    await recalculateAfterOverride(bid.jobId, bidId, newRank);

    res.json({
      success: true,
      message: 'Ranking overridden successfully',
      data: bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error overriding ranking',
      error: error.message
    });
  }
};

/**
 * @desc    Remove ranking override
 * @route   DELETE /api/bids/:id/override
 * @access  Private (Admin)
 */
exports.removeOverride = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (!bid.adminOverride.isOverridden) {
      return res.status(400).json({
        success: false,
        message: 'Bid does not have an active override'
      });
    }

    // Clear override
    bid.adminOverride.isOverridden = false;
    await bid.save();

    // Recalculate all rankings
    await calculateAndUpdateRankings(bid.jobId);

    res.json({
      success: true,
      message: 'Override removed and rankings recalculated',
      data: bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing override',
      error: error.message
    });
  }
};

/**
 * @desc    Get ranking statistics for a job
 * @route   GET /api/bids/job/:jobId/ranking-stats
 * @access  Public
 */
exports.getRankingStats = async (req, res) => {
  try {
    const stats = await getRankingStats(req.params.jobId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ranking stats',
      error: error.message
    });
  }
};

/**
 * @desc    Withdraw a bid (Contractor)
 * @route   DELETE /api/bids/:id
 * @access  Private (Contractor)
 */
exports.withdrawBid = async (req, res) => {
  try {
    const bid = await Bid.findOne({
      _id: req.params.id,
      contractorId: req.user.id
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw bid that is ${bid.status}`
      });
    }

    const jobId = bid.jobId;
    await bid.deleteOne();

    // Recalculate rankings
    await calculateAndUpdateRankings(jobId);

    res.json({
      success: true,
      message: 'Bid withdrawn successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error withdrawing bid',
      error: error.message
    });
  }
};

/**
 * @desc    Update a bid (Contractor)
 * @route   PUT /api/bids/:id
 * @access  Private (Contractor)
 */
exports.updateBid = async (req, res) => {
  try {
    const { amount, estimatedDays, message } = req.body;
    const bidId = req.params.id;
    const contractorId = req.user.id;

    const bid = await Bid.findOne({
      _id: bidId,
      contractorId: contractorId
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found or you do not have permission to edit it'
      });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit bid that is not pending'
      });
    }

    // Update bid fields
    if (amount !== undefined) bid.amount = amount;
    if (estimatedDays !== undefined) bid.estimatedDays = estimatedDays;
    if (message !== undefined) bid.message = message;

    await bid.save();

    // Recalculate rankings
    const updatedBids = await calculateAndUpdateRankings(bid.jobId);
    const updatedBid = updatedBids.find(b => b._id.toString() === bidId);

    res.json({
      success: true,
      message: 'Bid updated successfully',
      data: updatedBid || bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating bid',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a bid (Contractor)
 * @route   DELETE /api/bids/:id
 * @access  Private (Contractor)
 */
exports.deleteBid = async (req, res) => {
  try {
    const bidId = req.params.id;
    const contractorId = req.user.id;

    const bid = await Bid.findOne({
      _id: bidId,
      contractorId: contractorId
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found or you do not have permission to delete it'
      });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete bid that is not pending'
      });
    }

    const jobId = bid.jobId;
    await bid.deleteOne();

    // Recalculate rankings
    await calculateAndUpdateRankings(jobId);

    res.json({
      success: true,
      message: 'Bid deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting bid',
      error: error.message
    });
  }
};
