const Job = require('../models/Job');
const Bid = require('../models/Bid');
const { getJobsWithBidStatsPipeline } = require('../aggregations/bidAggregations');

/**
 * @desc    Get all jobs with filters
 * @route   GET /api/jobs
 * @access  Public
 */
exports.getJobs = async (req, res) => {
  try {
    const {
      status,
      trade,
      zipCode,
      isUrgent,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (trade) filters.trade = trade;
    if (zipCode) filters.zipCode = zipCode;
    if (isUrgent !== undefined) filters.isUrgent = isUrgent === 'true';

    const options = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort
    };

    const { jobs, total } = await Job.findWithFilters(filters, options);

    res.json({
      success: true,
      data: jobs,
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
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

/**
 * @desc    Get jobs with bid statistics (for dashboard)
 * @route   GET /api/jobs/dashboard
 * @access  Public
 */
exports.getJobsWithStats = async (req, res) => {
  try {
    const {
      status,
      trade,
      zipCode,
      isUrgent,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (trade) filters.trade = trade;
    if (zipCode) filters.zipCode = zipCode;
    if (isUrgent !== undefined) filters.isUrgent = isUrgent === 'true';

    const pipeline = getJobsWithBidStatsPipeline(filters);
    
    // Add pagination
    pipeline.push(
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    );

    const jobs = await Job.aggregate(pipeline);

    // Get total count
    const countPipeline = [...pipeline];
    countPipeline.pop(); // Remove limit
    countPipeline.pop(); // Remove skip
    countPipeline.push({ $count: 'total' });
    
    const countResult = await Job.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: jobs,
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
      message: 'Error fetching jobs with stats',
      error: error.message
    });
  }
};

/**
 * @desc    Get single job with bids
 * @route   GET /api/jobs/:id
 * @access  Public
 */
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('acceptedBid', 'amount estimatedDays contractorId');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get ranked bids
    const bids = await Bid.find({ jobId: job._id })
      .sort({ 'ranking.rank': 1 })
      .populate('contractorId', 'profile.name profile.trades metrics');

    res.json({
      success: true,
      data: {
        job,
        bids
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
};

/**
 * @desc    Create new job
 * @route   POST /api/jobs
 * @access  Private (Admin)
 */
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      zipCode,
      coordinates,
      address,
      trade,
      budget,
      isUrgent,
      deadline,
      zipIntelligence // Optional ZIP intelligence data for this job
    } = req.body;

    // Prepare job data
    const jobData = {
      title,
      description,
      zipCode,
      location: {
        type: 'Point',
        coordinates: coordinates && coordinates.length === 2 ? coordinates : [0, 0],
        address: address || ''
      },
      trade,
      budget,
      isUrgent: isUrgent || false,
      deadline,
      postedBy: req.user?.id || 'admin'
    };

    // If custom ZIP intelligence is provided, use it directly
    if (zipIntelligence) {
      jobData.zipIntelligence = {
        compositeScore: zipIntelligence.compositeScore,
        scores: {
          mobility: zipIntelligence.scores?.mobility || 50,
          businessActivity: zipIntelligence.scores?.businessActivity || 50,
          demographicFit: zipIntelligence.scores?.demographicFit || 50,
          seasonalDemand: zipIntelligence.scores?.seasonalDemand || 50
        }
      };
    }
    // Otherwise, the pre-save hook will populate ZIP intelligence from the ZipIntelligence collection

    const job = await Job.create(jobData);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: error.message
    });
  }
};

/**
 * @desc    Update job
 * @route   PUT /api/jobs/:id
 * @access  Private (Admin)
 */
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating job',
      error: error.message
    });
  }
};

/**
 * @desc    Delete job
 * @route   DELETE /api/jobs/:id
 * @access  Private (Admin)
 */
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Delete associated bids
    await Bid.deleteMany({ jobId: job._id });

    // Delete job
    await job.deleteOne();

    res.json({
      success: true,
      message: 'Job and associated bids deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting job',
      error: error.message
    });
  }
};

/**
 * @desc    Get job statistics
 * @route   GET /api/jobs/:id/stats
 * @access  Public
 */
exports.getJobStats = async (req, res) => {
  try {
    const { getBidStatsPipeline, getRankingFactorAnalysisPipeline } = require('../aggregations/bidAggregations');
    
    const [bidStats] = await Bid.aggregate(getBidStatsPipeline(req.params.id));
    const [factorAnalysis] = await Bid.aggregate(getRankingFactorAnalysisPipeline(req.params.id));

    res.json({
      success: true,
      data: {
        bidStats: bidStats || {
          totalBids: 0,
          pendingBids: 0,
          acceptedBids: 0,
          rejectedBids: 0
        },
        factorAnalysis: factorAnalysis || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job stats',
      error: error.message
    });
  }
};

/**
 * @desc    Get available trades
 * @route   GET /api/jobs/trades
 * @access  Public
 */
exports.getTrades = async (req, res) => {
  try {
    const trades = await Job.distinct('trade');

    res.json({
      success: true,
      data: trades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trades',
      error: error.message
    });
  }
};
