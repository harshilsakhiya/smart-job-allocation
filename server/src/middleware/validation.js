const Joi = require('joi');

// Helper function to validate requests
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    next();
  };
};

// Auth validation schemas
const registerContractorSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required'
  }),
  phone: Joi.string().optional(),
  trades: Joi.array().items(Joi.string()).optional(),
  zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required().messages({
    'string.pattern.base': 'Please provide a valid ZIP code',
    'any.required': 'ZIP code is required'
  }),
  coordinates: Joi.array().items(Joi.number()).length(2).optional(),
  address: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Job validation schemas
const createJobSchema = Joi.object({
  title: Joi.string().min(5).max(200).required().messages({
    'string.min': 'Title must be at least 5 characters',
    'string.max': 'Title cannot exceed 200 characters'
  }),
  description: Joi.string().min(10).required().messages({
    'string.min': 'Description must be at least 10 characters'
  }),
  zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
  coordinates: Joi.array().items(Joi.number()).length(2).optional(),
  address: Joi.string().optional(),
  trade: Joi.string().required(),
  budget: Joi.object({
    min: Joi.number().min(0).optional(),
    max: Joi.number().min(0).optional()
  }).optional(),
  isUrgent: Joi.boolean().optional(),
  deadline: Joi.date().greater('now').optional().messages({
    'date.greater': 'Deadline must be in the future'
  })
});

const updateJobSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(10).optional(),
  trade: Joi.string().optional(),
  budget: Joi.object({
    min: Joi.number().min(0).optional(),
    max: Joi.number().min(0).optional()
  }).optional(),
  isUrgent: Joi.boolean().optional(),
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').optional(),
  deadline: Joi.date().greater('now').optional()
}).min(1);

// Bid validation schemas
const submitBidSchema = Joi.object({
  jobId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid job ID format'
  }),
  amount: Joi.number().min(0).required().messages({
    'number.min': 'Bid amount must be positive',
    'any.required': 'Bid amount is required'
  }),
  estimatedDays: Joi.number().integer().min(1).required().messages({
    'number.min': 'Estimated days must be at least 1',
    'any.required': 'Estimated days is required'
  }),
  message: Joi.string().max(1000).optional().messages({
    'string.max': 'Message cannot exceed 1000 characters'
  })
});

const overrideRankingSchema = Joi.object({
  newRank: Joi.number().integer().min(1).required().messages({
    'number.min': 'Rank must be at least 1',
    'any.required': 'New rank is required'
  }),
  reason: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Reason must be at least 5 characters',
    'string.max': 'Reason cannot exceed 500 characters',
    'any.required': 'Reason is required'
  })
});

// ZIP validation schemas
const updateZipSchema = Joi.object({
  scores: Joi.object({
    mobility: Joi.number().min(0).max(100).required(),
    businessActivity: Joi.number().min(0).max(100).required(),
    demographicFit: Joi.number().min(0).max(100).required(),
    seasonalDemand: Joi.number().min(0).max(100).required()
  }).required(),
  metadata: Joi.object({
    population: Joi.number().optional(),
    medianIncome: Joi.number().optional(),
    businessCount: Joi.number().optional()
  }).optional()
});

const batchUpdateZipSchema = Joi.object({
  updates: Joi.array().items(
    Joi.object({
      zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
      scores: Joi.object({
        mobility: Joi.number().min(0).max(100).required(),
        businessActivity: Joi.number().min(0).max(100).required(),
        demographicFit: Joi.number().min(0).max(100).required(),
        seasonalDemand: Joi.number().min(0).max(100).required()
      }).required(),
      location: Joi.object({
        type: Joi.string().valid('Point').optional(),
        coordinates: Joi.array().items(Joi.number()).length(2).required()
      }).required(),
      metadata: Joi.object().optional()
    })
  ).min(1).required()
});

const compareZipSchema = Joi.object({
  zipCodes: Joi.array().items(
    Joi.string().pattern(/^\d{5}(-\d{4})?$/)
  ).min(2).required().messages({
    'array.min': 'Please provide at least 2 ZIP codes to compare'
  })
});

module.exports = {
  validate,
  schemas: {
    registerContractor: registerContractorSchema,
    login: loginSchema,
    createJob: createJobSchema,
    updateJob: updateJobSchema,
    submitBid: submitBidSchema,
    overrideRanking: overrideRankingSchema,
    updateZip: updateZipSchema,
    batchUpdateZip: batchUpdateZipSchema,
    compareZip: compareZipSchema
  }
};
