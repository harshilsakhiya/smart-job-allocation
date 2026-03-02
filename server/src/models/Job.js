const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true
  },
  zipCode: {
    type: String,
    required: [true, 'ZIP code is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: String
  },
  trade: {
    type: String,
    required: [true, 'Trade type is required'],
    trim: true
  },
  budget: {
    min: Number,
    max: Number
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  postedBy: {
    type: String,
    required: true,
    default: 'admin'
  },
  zipIntelligence: {
    compositeScore: Number,
    scores: {
      mobility: Number,
      businessActivity: Number,
      demographicFit: Number,
      seasonalDemand: Number
    }
  },
  deadline: {
    type: Date
  },
  bidCount: {
    type: Number,
    default: 0
  },
  acceptedBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  }
}, {
  timestamps: true
});

// Indexes
jobSchema.index({ zipCode: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ trade: 1 });
jobSchema.index({ isUrgent: 1 });
jobSchema.index({ location: '2dsphere' });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ status: 1, createdAt: -1 }); // For dashboard queries

// Pre-save hook to capture ZIP intelligence
jobSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('zipCode')) {
    try {
      const ZipIntelligence = require('./ZipIntelligence');
      const zipIntel = await ZipIntelligence.getByZipCode(this.zipCode);
      
      this.zipIntelligence = {
        compositeScore: zipIntel.compositeScore,
        scores: { ...zipIntel.scores }
      };
    } catch (error) {
      console.error('Error fetching ZIP intelligence:', error);
    }
  }
  next();
});

// Method to update bid count
jobSchema.methods.updateBidCount = async function() {
  const Bid = require('./Bid');
  this.bidCount = await Bid.countDocuments({ jobId: this._id });
  await this.save();
};

// Static method to find jobs with filters
jobSchema.statics.findWithFilters = async function(filters = {}, options = {}) {
  const query = {};
  
  if (filters.status) query.status = filters.status;
  if (filters.trade) query.trade = filters.trade;
  if (filters.zipCode) query.zipCode = filters.zipCode;
  if (filters.isUrgent !== undefined) query.isUrgent = filters.isUrgent;
  
  // Geospatial filter
  if (filters.near && filters.radius) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: filters.near
        },
        $maxDistance: filters.radius * 1000 // Convert km to meters
      }
    };
  }
  
  const jobs = await this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20)
    .populate('acceptedBid', 'amount estimatedDays');
    
  const total = await this.countDocuments(query);
  
  return { jobs, total };
};

module.exports = mongoose.model('Job', jobSchema);
