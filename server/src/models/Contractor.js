const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const contractorSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profile: {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    trades: [{
      type: String,
      trim: true
    }],
    location: {
      zipCode: {
        type: String,
        required: [true, 'ZIP code is required']
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      },
      address: String
    }
  },
  metrics: {
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    responseTimeAvg: {
      type: Number, // in minutes
      default: 0,
      min: 0
    },
    activeJobsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalJobsCompleted: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
// Indexes (email already has unique index from schema definition)
contractorSchema.index({ 'profile.location.zipCode': 1 });
contractorSchema.index({ 'metrics.rating': -1 });
contractorSchema.index({ 'profile.location.coordinates': '2dsphere' });

// Hash password before saving
contractorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
contractorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update active jobs count
contractorSchema.methods.updateActiveJobsCount = async function() {
  const Bid = require('./Bid');
  const count = await Bid.countDocuments({
    contractorId: this._id,
    status: 'accepted'
  });
  this.metrics.activeJobsCount = count;
  await this.save();
};

module.exports = mongoose.model('Contractor', contractorSchema);
