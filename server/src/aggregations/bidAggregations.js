/**
 * MongoDB Aggregation Pipelines for Bid Rankings
 */

const mongoose = require('mongoose');

/**
 * Get ranked bids for a job with full contractor details
 * @param {String} jobId - Job ID
 * @param {Object} options - Query options
 * @returns {Array} Aggregation pipeline stages
 */
function getRankedBidsPipeline(jobId, options = {}) {
  const pipeline = [
    // Match bids for the specific job
    {
      $match: {
        jobId: new mongoose.Types.ObjectId(jobId),
        ...(options.excludeRejected && { status: { $ne: 'rejected' } })
      }
    },

    // Lookup contractor details
    {
      $lookup: {
        from: 'contractors',
        localField: 'contractorId',
        foreignField: '_id',
        as: 'contractor'
      }
    },

    // Unwind contractor array
    {
      $unwind: {
        path: '$contractor',
        preserveNullAndEmptyArrays: true
      }
    },

    // Lookup job details for distance calculation
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job'
      }
    },

    {
      $unwind: {
        path: '$job',
        preserveNullAndEmptyArrays: true
      }
    },

    // Project required fields with ranking details
    {
      $project: {
        _id: 1,
        amount: 1,
        estimatedDays: 1,
        message: 1,
        status: 1,
        submittedAt: 1,
        'ranking.score': 1,
        'ranking.rank': 1,
        'ranking.factors': 1,
        'ranking.calculatedAt': 1,
        'adminOverride.isOverridden': 1,
        'adminOverride.originalRank': 1,
        'adminOverride.newRank': 1,
        contractor: {
          _id: '$contractor._id',
          name: '$contractor.profile.name',
          trades: '$contractor.profile.trades',
          zipCode: '$contractor.profile.location.zipCode',
          rating: '$contractor.metrics.rating',
          completionRate: '$contractor.metrics.completionRate',
          responseTimeAvg: '$contractor.metrics.responseTimeAvg',
          activeJobsCount: '$contractor.metrics.activeJobsCount'
        },
        job: {
          _id: '$job._id',
          title: '$job.title',
          trade: '$job.trade',
          isUrgent: '$job.isUrgent'
        }
      }
    },

    // Sort by rank
    {
      $sort: {
        'ranking.rank': 1,
        submittedAt: 1
      }
    }
  ];

  // Add pagination if specified
  if (options.skip) {
    pipeline.push({ $skip: options.skip });
  }
  if (options.limit) {
    pipeline.push({ $limit: options.limit });
  }

  return pipeline;
}

/**
 * Get bid statistics for a job
 * @param {String} jobId - Job ID
 * @returns {Array} Aggregation pipeline
 */
function getBidStatsPipeline(jobId) {
  return [
    {
      $match: {
        jobId: new mongoose.Types.ObjectId(jobId)
      }
    },
    {
      $group: {
        _id: null,
        totalBids: { $sum: 1 },
        pendingBids: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        acceptedBids: {
          $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
        },
        rejectedBids: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        },
        avgBidAmount: { $avg: '$amount' },
        minBidAmount: { $min: '$amount' },
        maxBidAmount: { $max: '$amount' },
        avgRankingScore: { $avg: '$ranking.score' },
        maxRankingScore: { $max: '$ranking.score' },
        minRankingScore: { $min: '$ranking.score' },
        overriddenCount: {
          $sum: { $cond: ['$adminOverride.isOverridden', 1, 0] }
        }
      }
    }
  ];
}

/**
 * Get contractor bidding history
 * @param {String} contractorId - Contractor ID
 * @returns {Array} Aggregation pipeline
 */
function getContractorBiddingHistoryPipeline(contractorId) {
  return [
    {
      $match: {
        contractorId: new mongoose.Types.ObjectId(contractorId)
      }
    },
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job'
      }
    },
    {
      $unwind: '$job'
    },
    {
      $project: {
        _id: 1,
        amount: 1,
        estimatedDays: 1,
        status: 1,
        submittedAt: 1,
        ranking: 1,
        job: {
          _id: '$job._id',
          title: '$job.title',
          zipCode: '$job.zipCode',
          trade: '$job.trade',
          isUrgent: '$job.isUrgent',
          status: '$job.status'
        }
      }
    },
    {
      $sort: { submittedAt: -1 }
    }
  ];
}

/**
 * Get jobs with bid counts and top contractor
 * @param {Object} filters - Query filters
 * @returns {Array} Aggregation pipeline
 */
function getJobsWithBidStatsPipeline(filters = {}) {
  const matchStage = {};
  
  if (filters.status) matchStage.status = filters.status;
  if (filters.trade) matchStage.trade = filters.trade;
  if (filters.zipCode) matchStage.zipCode = filters.zipCode;
  if (filters.isUrgent !== undefined) matchStage.isUrgent = filters.isUrgent;

  return [
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $lookup: {
        from: 'bids',
        localField: '_id',
        foreignField: 'jobId',
        as: 'bids'
      }
    },
    {
      $addFields: {
        bidCount: { $size: '$bids' },
        topBid: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$bids',
                cond: { $eq: ['$$this.ranking.rank', 1] }
              }
            },
            0
          ]
        }
      }
    },
    {
      $lookup: {
        from: 'contractors',
        localField: 'topBid.contractorId',
        foreignField: '_id',
        as: 'topContractor'
      }
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        zipCode: 1,
        trade: 1,
        isUrgent: 1,
        status: 1,
        budget: 1,
        deadline: 1,
        createdAt: 1,
        bidCount: 1,
        zipIntelligence: 1,
        topBid: {
          amount: '$topBid.amount',
          estimatedDays: '$topBid.estimatedDays',
          rankingScore: '$topBid.ranking.score'
        },
        topContractor: {
          $arrayElemAt: [
            {
              $map: {
                input: '$topContractor',
                as: 'c',
                in: {
                  name: '$$c.profile.name',
                  rating: '$$c.metrics.rating'
                }
              }
            },
            0
          ]
        }
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ];
}

/**
 * Get ranking factor averages for analysis
 * @param {String} jobId - Job ID
 * @returns {Array} Aggregation pipeline
 */
function getRankingFactorAnalysisPipeline(jobId) {
  return [
    {
      $match: {
        jobId: new mongoose.Types.ObjectId(jobId)
      }
    },
    {
      $group: {
        _id: null,
        avgDistanceScore: { $avg: '$ranking.factors.distance.score' },
        avgDistanceRaw: { $avg: '$ranking.factors.distance.rawValue' },
        avgRatingScore: { $avg: '$ranking.factors.rating.score' },
        avgRatingRaw: { $avg: '$ranking.factors.rating.rawValue' },
        avgCompletionScore: { $avg: '$ranking.factors.completionRate.score' },
        avgCompletionRaw: { $avg: '$ranking.factors.completionRate.rawValue' },
        avgResponseTimeScore: { $avg: '$ranking.factors.responseTime.score' },
        avgResponseTimeRaw: { $avg: '$ranking.factors.responseTime.rawValue' },
        avgTradeMatchScore: { $avg: '$ranking.factors.tradeMatch.score' },
        tradeMatchCount: {
          $sum: { $cond: ['$ranking.factors.tradeMatch.rawValue', 1, 0] }
        },
        workloadPenaltyCount: {
          $sum: { $cond: ['$ranking.factors.workloadPenalty.applied', 1, 0] }
        }
      }
    }
  ];
}

/**
 * Get leaderboard of top performing contractors
 * @param {Object} options - Query options
 * @returns {Array} Aggregation pipeline
 */
function getContractorLeaderboardPipeline(options = {}) {
  const pipeline = [
    {
      $match: {
        status: 'accepted'
      }
    },
    {
      $group: {
        _id: '$contractorId',
        totalWins: { $sum: 1 },
        avgRankingScore: { $avg: '$ranking.score' },
        avgBidAmount: { $avg: '$amount' }
      }
    },
    {
      $lookup: {
        from: 'contractors',
        localField: '_id',
        foreignField: '_id',
        as: 'contractor'
      }
    },
    {
      $unwind: '$contractor'
    },
    {
      $project: {
        _id: 1,
        contractorName: '$contractor.profile.name',
        contractorTrades: '$contractor.profile.trades',
        contractorRating: '$contractor.metrics.rating',
        totalWins: 1,
        avgRankingScore: 1,
        avgBidAmount: 1
      }
    },
    {
      $sort: { totalWins: -1, avgRankingScore: -1 }
    }
  ];

  if (options.limit) {
    pipeline.push({ $limit: options.limit });
  }

  return pipeline;
}

module.exports = {
  getRankedBidsPipeline,
  getBidStatsPipeline,
  getContractorBiddingHistoryPipeline,
  getJobsWithBidStatsPipeline,
  getRankingFactorAnalysisPipeline,
  getContractorLeaderboardPipeline
};
