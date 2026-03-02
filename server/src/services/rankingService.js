/**
 * Ranking Service - Calculates contractor bid rankings using weighted factors
 * 
 * Weight Formula:
 * - Distance from ZIP: 25%
 * - Contractor Rating: 25%
 * - Past Completion Rate: 20%
 * - Response Time Average: 10%
 * - Trade Match Accuracy: 20%
 * 
 * Special Rules:
 * - Urgent jobs: Response time weight is doubled (20%)
 * - Workload penalty: 15% score reduction if active jobs >= 5
 */

const Contractor = require('../models/Contractor');
const Job = require('../models/Job');
const Bid = require('../models/Bid');

// Default weights configuration
const DEFAULT_WEIGHTS = {
  distance: 0.25,
  rating: 0.25,
  completionRate: 0.20,
  responseTime: 0.10,
  tradeMatch: 0.20
};

// Constants for special rules
const WORKLOAD_PENALTY_THRESHOLD = 5;
const WORKLOAD_PENALTY_AMOUNT = 0.15; // 15% reduction
const URGENT_RESPONSE_TIME_MULTIPLIER = 2.0;

// Maximum distance for scoring (in km) - beyond this gets 0 score
const MAX_DISTANCE_KM = 100;

// Maximum response time for scoring (in minutes)
const MAX_RESPONSE_TIME_MINUTES = 1440; // 24 hours

/**
 * Calculate Haversine distance between two coordinates
 * @param {Array} coord1 - [longitude, latitude]
 * @param {Array} coord2 - [longitude, latitude]
 * @returns {Number} Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2 || coord1.length !== 2 || coord2.length !== 2) {
    return MAX_DISTANCE_KM;
  }

  const R = 6371; // Earth's radius in kilometers
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Normalize a value to 0-100 scale
 * @param {Number} value - Raw value
 * @param {Number} min - Minimum expected value
 * @param {Number} max - Maximum expected value
 * @param {Boolean} inverse - If true, lower values get higher scores
 * @returns {Number} Normalized score (0-100)
 */
function normalizeScore(value, min, max, inverse = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return inverse ? 100 : 0;
  }

  // Clamp value to range
  const clampedValue = Math.max(min, Math.min(max, value));
  
  // Calculate normalized score
  let normalized = ((clampedValue - min) / (max - min)) * 100;
  
  if (inverse) {
    normalized = 100 - normalized;
  }

  return Math.round(normalized * 100) / 100;
}

/**
 * Calculate individual factor scores
 */
const factorCalculators = {
  /**
   * Distance score - closer is better (inverse)
   */
  distance: (contractor, job) => {
    const contractorCoords = contractor.profile?.location?.coordinates;
    const jobCoords = job.location?.coordinates;
    
    const distanceKm = calculateDistance(contractorCoords, jobCoords);
    const score = normalizeScore(distanceKm, 0, MAX_DISTANCE_KM, true);
    
    return {
      score,
      rawValue: Math.round(distanceKm * 100) / 100
    };
  },

  /**
   * Rating score - higher is better
   */
  rating: (contractor) => {
    const rating = contractor.metrics?.rating || 0;
    const score = (rating / 5) * 100; // Convert 0-5 rating to 0-100 score
    
    return {
      score: Math.round(score * 100) / 100,
      rawValue: rating
    };
  },

  /**
   * Completion rate score - higher is better
   */
  completionRate: (contractor) => {
    const rate = contractor.metrics?.completionRate || 0;
    const score = normalizeScore(rate, 0, 100, false);
    
    return {
      score,
      rawValue: rate
    };
  },

  /**
   * Response time score - faster is better (inverse)
   */
  responseTime: (contractor) => {
    const responseTime = contractor.metrics?.responseTimeAvg || MAX_RESPONSE_TIME_MINUTES;
    const score = normalizeScore(responseTime, 0, MAX_RESPONSE_TIME_MINUTES, true);
    
    return {
      score,
      rawValue: responseTime
    };
  },

  /**
   * Trade match score - exact match is best
   */
  tradeMatch: (contractor, job) => {
    const contractorTrades = contractor.profile?.trades || [];
    const jobTrade = job.trade;
    
    const isMatch = contractorTrades.some(trade => 
      trade.toLowerCase() === jobTrade.toLowerCase()
    );
    
    return {
      score: isMatch ? 100 : 0,
      rawValue: isMatch
    };
  }
};

/**
 * Calculate weights based on job urgency
 * @param {Object} weights - Base weights
 * @param {Boolean} isUrgent - Whether job is urgent
 * @returns {Object} Adjusted weights
 */
function calculateWeights(weights, isUrgent) {
  let adjustedWeights = { ...weights };

  if (isUrgent) {
    // Double the response time weight
    const responseTimeIncrease = adjustedWeights.responseTime * (URGENT_RESPONSE_TIME_MULTIPLIER - 1);
    adjustedWeights.responseTime *= URGENT_RESPONSE_TIME_MULTIPLIER;

    // Reduce other weights proportionally to maintain sum = 1.0
    const otherFactors = ['distance', 'rating', 'completionRate', 'tradeMatch'];
    const totalOtherWeight = otherFactors.reduce((sum, factor) => sum + adjustedWeights[factor], 0);
    
    otherFactors.forEach(factor => {
      adjustedWeights[factor] -= (adjustedWeights[factor] / totalOtherWeight) * responseTimeIncrease;
    });
  }

  // Round to avoid floating point issues
  Object.keys(adjustedWeights).forEach(key => {
    adjustedWeights[key] = Math.round(adjustedWeights[key] * 1000) / 1000;
  });

  return adjustedWeights;
}

/**
 * Apply workload penalty if contractor has too many active jobs
 * @param {Number} baseScore - Calculated score
 * @param {Number} activeJobsCount - Number of active jobs
 * @returns {Object} Adjusted score and penalty info
 */
function applyWorkloadPenalty(baseScore, activeJobsCount) {
  if (activeJobsCount >= WORKLOAD_PENALTY_THRESHOLD) {
    const penaltyAmount = WORKLOAD_PENALTY_AMOUNT;
    const adjustedScore = baseScore * (1 - penaltyAmount);
    
    return {
      score: Math.round(adjustedScore * 100) / 100,
      penalty: {
        applied: true,
        penaltyAmount: Math.round(penaltyAmount * 100) // Store as percentage
      }
    };
  }

  return {
    score: baseScore,
    penalty: {
      applied: false,
      penaltyAmount: 0
    }
  };
}

/**
 * Calculate ranking for a single bid
 * @param {Object} bid - Bid document
 * @param {Object} contractor - Contractor document
 * @param {Object} job - Job document
 * @param {Object} customWeights - Optional custom weights
 * @returns {Object} Ranking result
 */
function calculateBidRanking(bid, contractor, job, customWeights = null) {
  const weights = customWeights || DEFAULT_WEIGHTS;
  const adjustedWeights = calculateWeights(weights, job.isUrgent);

  // Calculate individual factor scores
  const factors = {
    distance: factorCalculators.distance(contractor, job),
    rating: factorCalculators.rating(contractor),
    completionRate: factorCalculators.completionRate(contractor),
    responseTime: factorCalculators.responseTime(contractor),
    tradeMatch: factorCalculators.tradeMatch(contractor, job)
  };

  // Calculate weighted score
  let weightedScore = 0;
  Object.keys(factors).forEach(factor => {
    weightedScore += factors[factor].score * adjustedWeights[factor];
  });

  // Apply workload penalty
  const activeJobsCount = contractor.metrics?.activeJobsCount || 0;
  const { score: finalScore, penalty } = applyWorkloadPenalty(weightedScore, activeJobsCount);

  return {
    score: Math.round(finalScore * 100) / 100,
    factors: {
      distance: factors.distance,
      rating: factors.rating,
      completionRate: factors.completionRate,
      responseTime: factors.responseTime,
      tradeMatch: factors.tradeMatch,
      workloadPenalty: penalty
    },
    weights: adjustedWeights,
    calculatedAt: new Date()
  };
}

/**
 * Calculate and update rankings for all bids on a job
 * @param {String} jobId - Job ID
 * @returns {Array} Updated bids with rankings
 */
async function calculateAndUpdateRankings(jobId) {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  // Get all pending bids for this job
  const bids = await Bid.find({
    jobId,
    status: { $in: ['pending', 'accepted'] }
  }).populate('contractorId');

  if (bids.length === 0) {
    return [];
  }

  // Calculate rankings for each bid
  const rankedBids = bids.map(bid => {
    const ranking = calculateBidRanking(bid, bid.contractorId, job);
    return {
      bidId: bid._id,
      ranking
    };
  });

  // Sort by score descending
  rankedBids.sort((a, b) => b.ranking.score - a.ranking.score);

  // Assign ranks and update bids
  const updates = rankedBids.map((item, index) => ({
    updateOne: {
      filter: { _id: item.bidId },
      update: {
        $set: {
          'ranking.score': item.ranking.score,
          'ranking.rank': index + 1,
          'ranking.factors': item.ranking.factors,
          'ranking.calculatedAt': item.ranking.calculatedAt
        }
      }
    }
  }));

  await Bid.bulkWrite(updates);

  // Return updated bids
  return await Bid.find({
    jobId,
    status: { $in: ['pending', 'accepted'] }
  })
    .sort({ 'ranking.rank': 1 })
    .populate('contractorId', 'profile.name profile.trades metrics');
}

/**
 * Recalculate rankings after admin override
 * @param {String} jobId - Job ID
 * @param {String} overriddenBidId - Bid that was overridden
 * @param {Number} newRank - New rank position
 */
async function recalculateAfterOverride(jobId, overriddenBidId, newRank) {
  const bids = await Bid.find({
    jobId,
    status: { $in: ['pending', 'accepted'] },
    _id: { $ne: overriddenBidId }
  }).sort({ 'ranking.score': -1 });

  // Reassign ranks, skipping the overridden bid's new position
  let currentRank = 1;
  const updates = [];

  for (const bid of bids) {
    if (currentRank === newRank) {
      currentRank++; // Skip the overridden position
    }
    
    updates.push({
      updateOne: {
        filter: { _id: bid._id },
        update: { $set: { 'ranking.rank': currentRank } }
      }
    });
    currentRank++;
  }

  if (updates.length > 0) {
    await Bid.bulkWrite(updates);
  }
}

/**
 * Get ranking statistics for a job
 * @param {String} jobId - Job ID
 * @returns {Object} Statistics
 */
async function getRankingStats(jobId) {
  const stats = await Bid.aggregate([
    { $match: { jobId: new require('mongoose').Types.ObjectId(jobId) } },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$ranking.score' },
        maxScore: { $max: '$ranking.score' },
        minScore: { $min: '$ranking.score' },
        totalBids: { $sum: 1 },
        overriddenCount: {
          $sum: { $cond: ['$adminOverride.isOverridden', 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    avgScore: 0,
    maxScore: 0,
    minScore: 0,
    totalBids: 0,
    overriddenCount: 0
  };
}

module.exports = {
  DEFAULT_WEIGHTS,
  WORKLOAD_PENALTY_THRESHOLD,
  WORKLOAD_PENALTY_AMOUNT,
  URGENT_RESPONSE_TIME_MULTIPLIER,
  calculateBidRanking,
  calculateAndUpdateRankings,
  recalculateAfterOverride,
  getRankingStats,
  calculateDistance,
  normalizeScore
};
