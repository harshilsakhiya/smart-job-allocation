const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  contractorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contractor',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount must be positive']
  },
  estimatedDays: {
    type: Number,
    required: [true, 'Estimated days is required'],
    min: [1, 'Estimated days must be at least 1']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  ranking: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    rank: {
      type: Number,
      min: 1
    },
    factors: {
      distance: {
        score: Number,
        rawValue: Number // in km
      },
      rating: {
        score: Number,
        rawValue: Number // 0-5
      },
      completionRate: {
        score: Number,
        rawValue: Number // 0-100
      },
      responseTime: {
        score: Number,
        rawValue: Number // in minutes
      },
      tradeMatch: {
        score: Number,
        rawValue: Boolean // true/false
      },
      workloadPenalty: {
        applied: Boolean,
        penaltyAmount: Number
      }
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  adminOverride: {
    isOverridden: {
      type: Boolean,
      default: false
    },
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    overriddenAt: Date,
    originalRank: Number,
    newRank: Number,
    reason: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date
}, {
  timestamps: true
});

// Compound indexes for efficient querying
bidSchema.index({ jobId: 1, 'ranking.score': -1 });
bidSchema.index({ jobId: 1, 'ranking.rank': 1 });
bidSchema.index({ contractorId: 1, status: 1 });
bidSchema.index({ jobId: 1, contractorId: 1 }, { unique: true }); // One bid per contractor per job

// Pre-save hook to prevent duplicate bids
bidSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingBid = await this.constructor.findOne({
      jobId: this.jobId,
      contractorId: this.contractorId
    });
    
    if (existingBid) {
      throw new Error('Contractor has already placed a bid on this job');
    }
  }
  next();
});

// Post-save hook to update job bid count
bidSchema.post('save', async function() {
  try {
    const Job = require('./Job');
    const job = await Job.findById(this.jobId);
    if (job) {
      await job.updateBidCount();
    }
  } catch (error) {
    console.error('Error updating job bid count:', error);
  }
});

// Method to accept bid
bidSchema.methods.accept = async function(adminId) {
  this.status = 'accepted';
  this.respondedAt = new Date();
  
  // Update job status
  const Job = require('./Job');
  await Job.findByIdAndUpdate(this.jobId, {
    status: 'in_progress',
    acceptedBid: this._id
  });
  
  // Update contractor active jobs count
  const Contractor = require('./Contractor');
  const contractor = await Contractor.findById(this.contractorId);
  if (contractor) {
    contractor.metrics.activeJobsCount += 1;
    await contractor.save();
  }
  
  // Reject all other bids for this job
  await this.constructor.updateMany(
    { jobId: this.jobId, _id: { $ne: this._id }, status: 'pending' },
    { status: 'rejected', respondedAt: new Date() }
  );
  
  await this.save();
};

// Method to reject bid
bidSchema.methods.reject = async function() {
  this.status = 'rejected';
  this.respondedAt = new Date();
  await this.save();
};

// Static method to get ranked bids for a job
bidSchema.statics.getRankedBidsForJob = async function(jobId, options = {}) {
  const query = { jobId };
  
  if (options.excludeRejected) {
    query.status = { $ne: 'rejected' };
  }
  
  return await this.find(query)
    .sort({ 'ranking.rank': 1 })
    .populate('contractorId', 'profile.name profile.trades metrics')
    .lean();
};

// Static method to check if contractor can bid
bidSchema.statics.canBid = async function(jobId, contractorId) {
  const existingBid = await this.findOne({ jobId, contractorId });
  return !existingBid;
};

module.exports = mongoose.model('Bid', bidSchema);
