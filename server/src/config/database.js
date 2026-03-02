const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 6+ doesn't need these options anymore, but keeping for clarity
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Enable geospatial indexing on required collections
    await setupIndexes();

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const setupIndexes = async () => {
  try {
    // ZIP Intelligence - Geospatial index
    const ZipIntelligence = require('../models/ZipIntelligence');
    await ZipIntelligence.collection.createIndex({ location: '2dsphere' });
    
    // Job - Geospatial index
    const Job = require('../models/Job');
    await Job.collection.createIndex({ location: '2dsphere' });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
  }
};

module.exports = connectDB;
