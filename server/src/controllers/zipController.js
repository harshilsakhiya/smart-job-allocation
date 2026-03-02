const zipService = require('../services/zipService');
const ZipIntelligence = require('../models/ZipIntelligence');

/**
 * @desc    Get ZIP intelligence by ZIP code
 * @route   GET /api/zip/:zipCode
 * @access  Public
 */
exports.getZipIntelligence = async (req, res) => {
  try {
    const { zipCode } = req.params;

    // Validate ZIP code format
    if (!zipService.isValidZipCode(zipCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ZIP code format'
      });
    }

    const zipIntel = await zipService.getZipIntelligence(zipCode);

    res.json({
      success: true,
      data: zipIntel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ZIP intelligence',
      error: error.message
    });
  }
};

/**
 * @desc    Get ZIP score breakdown
 * @route   GET /api/zip/:zipCode/breakdown
 * @access  Public
 */
exports.getScoreBreakdown = async (req, res) => {
  try {
    const { zipCode } = req.params;

    if (!zipService.isValidZipCode(zipCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ZIP code format'
      });
    }

    const breakdown = await zipService.getScoreBreakdown(zipCode);

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching score breakdown',
      error: error.message
    });
  }
};

/**
 * @desc    Update ZIP scores (Admin)
 * @route   PUT /api/zip/:zipCode
 * @access  Private (Admin)
 */
exports.updateZipScores = async (req, res) => {
  try {
    const { zipCode } = req.params;
    const { scores, metadata } = req.body;

    if (!zipService.isValidZipCode(zipCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ZIP code format'
      });
    }

    // Validate scores
    const requiredScores = ['mobility', 'businessActivity', 'demographicFit', 'seasonalDemand'];
    for (const score of requiredScores) {
      if (scores[score] === undefined || scores[score] < 0 || scores[score] > 100) {
        return res.status(400).json({
          success: false,
          message: `Invalid or missing score: ${score}. Must be between 0 and 100.`
        });
      }
    }

    const zipIntel = await zipService.updateZipScores(zipCode, scores, metadata);

    res.json({
      success: true,
      message: 'ZIP scores updated successfully',
      data: zipIntel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating ZIP scores',
      error: error.message
    });
  }
};

/**
 * @desc    Batch update ZIP scores (Admin)
 * @route   POST /api/zip/batch-update
 * @access  Private (Admin)
 */
exports.batchUpdateZipScores = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be a non-empty array'
      });
    }

    // Validate each update
    for (const update of updates) {
      if (!update.zipCode || !zipService.isValidZipCode(update.zipCode)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ZIP code: ${update.zipCode}`
        });
      }

      if (!update.scores) {
        return res.status(400).json({
          success: false,
          message: `Scores required for ZIP: ${update.zipCode}`
        });
      }
    }

    const result = await zipService.batchUpdateZipScores(updates);

    res.json({
      success: true,
      message: 'Batch update completed',
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in batch update',
      error: error.message
    });
  }
};

/**
 * @desc    Get ZIP codes by score range
 * @route   GET /api/zip
 * @access  Public
 */
exports.getZipCodesByScoreRange = async (req, res) => {
  try {
    const { minScore = 0, maxScore = 100, page = 1, limit = 50 } = req.query;

    const zipCodes = await zipService.getZipCodesByScoreRange(
      parseFloat(minScore),
      parseFloat(maxScore),
      {
        skip: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit)
      }
    );

    res.json({
      success: true,
      data: zipCodes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: zipCodes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ZIP codes',
      error: error.message
    });
  }
};

/**
 * @desc    Get top performing ZIP codes
 * @route   GET /api/zip/top
 * @access  Public
 */
exports.getTopZipCodes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const zipCodes = await zipService.getTopZipCodes(parseInt(limit));

    res.json({
      success: true,
      data: zipCodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top ZIP codes',
      error: error.message
    });
  }
};

/**
 * @desc    Compare multiple ZIP codes
 * @route   POST /api/zip/compare
 * @access  Public
 */
exports.compareZipCodes = async (req, res) => {
  try {
    const { zipCodes } = req.body;

    if (!Array.isArray(zipCodes) || zipCodes.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 ZIP codes to compare'
      });
    }

    // Validate all ZIP codes
    for (const zip of zipCodes) {
      if (!zipService.isValidZipCode(zip)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ZIP code: ${zip}`
        });
      }
    }

    const comparison = await zipService.compareZipCodes(zipCodes);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error comparing ZIP codes',
      error: error.message
    });
  }
};

/**
 * @desc    Get ZIP statistics
 * @route   GET /api/zip/stats
 * @access  Public
 */
exports.getZipStatistics = async (req, res) => {
  try {
    const stats = await zipService.getZipStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ZIP statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Seed ZIP data (Admin)
 * @route   POST /api/zip/seed
 * @access  Private (Admin)
 */
exports.seedZipData = async (req, res) => {
  try {
    const { zipData } = req.body;

    if (!Array.isArray(zipData) || zipData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of ZIP data'
      });
    }

    const result = await zipService.seedZipData(zipData);

    res.json({
      success: true,
      message: 'ZIP data seeded successfully',
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error seeding ZIP data',
      error: error.message
    });
  }
};
