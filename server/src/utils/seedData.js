const mongoose = require('mongoose');
const Contractor = require('../models/Contractor');
const Job = require('../models/Job');
const Bid = require('../models/Bid');
const ZipIntelligence = require('../models/ZipIntelligence');
const { generateIntelligentScores } = require('../models/ZipIntelligence');

// Connect to database
require('../config/database');

const sampleContractors = [
  {
    email: 'john.plumber@example.com',
    password: 'password123',
    profile: {
      name: 'John Smith',
      phone: '555-0101',
      trades: ['plumbing'],
      location: {
        zipCode: '10001',
        coordinates: [-74.006, 40.7128],
        address: 'New York, NY'
      }
    },
    metrics: {
      rating: 4.8,
      completionRate: 95,
      responseTimeAvg: 15,
      activeJobsCount: 2,
      totalJobsCompleted: 45
    }
  },
  {
    email: 'electric.mike@example.com',
    password: 'password123',
    profile: {
      name: 'Mike Johnson',
      phone: '555-0102',
      trades: ['electrical'],
      location: {
        zipCode: '10001',
        coordinates: [-74.010, 40.715],
        address: 'New York, NY'
      }
    },
    metrics: {
      rating: 4.5,
      completionRate: 88,
      responseTimeAvg: 25,
      activeJobsCount: 1,
      totalJobsCompleted: 32
    }
  },
  {
    email: 'carpenter.sarah@example.com',
    password: 'password123',
    profile: {
      name: 'Sarah Williams',
      phone: '555-0103',
      trades: ['carpentry'],
      location: {
        zipCode: '10002',
        coordinates: [-74.002, 40.710],
        address: 'New York, NY'
      }
    },
    metrics: {
      rating: 4.9,
      completionRate: 98,
      responseTimeAvg: 10,
      activeJobsCount: 3,
      totalJobsCompleted: 67
    }
  }
];

const sampleJobs = [
  {
    title: 'Emergency Pipe Repair',
    description: 'Burst pipe in kitchen needs immediate attention',
    zipCode: '10001',
    location: {
      type: 'Point',
      coordinates: [-74.006, 40.7128],
      address: '123 Main St, New York, NY'
    },
    trade: 'plumbing',
    budget: {
      min: 200,
      max: 500
    },
    isUrgent: true,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Electrical Outlet Installation',
    description: 'Install 4 new electrical outlets in living room',
    zipCode: '10001',
    location: {
      type: 'Point',
      coordinates: [-74.008, 40.714],
      address: '456 Oak Ave, New York, NY'
    },
    trade: 'electrical',
    budget: {
      min: 150,
      max: 300
    },
    isUrgent: false,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  }
];

async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Clear existing data
    await Contractor.deleteMany({});
    await Job.deleteMany({});
    await Bid.deleteMany({});
    await ZipIntelligence.deleteMany({});
    
    console.log('Existing data cleared');
    
    // Create contractors
    const contractors = await Contractor.insertMany(sampleContractors);
    console.log(`Created ${contractors.length} contractors`);
    
    // Create jobs
    const jobs = await Job.insertMany(sampleJobs);
    console.log(`Created ${jobs.length} jobs`);
    
    // Create sample bids
    const bids = [];
    
    // John bids on plumbing job
    bids.push({
      jobId: jobs[0]._id,
      contractorId: contractors[0]._id,
      amount: 350,
      estimatedDays: 2,
      message: 'Experienced plumber available today for emergency repair'
    });
    
    // Mike bids on electrical job
    bids.push({
      jobId: jobs[1]._id,
      contractorId: contractors[1]._id,
      amount: 200,
      estimatedDays: 3,
      message: 'Licensed electrician with 10+ years experience'
    });
    
    // Sarah also bids on electrical job (competition)
    bids.push({
      jobId: jobs[1]._id,
      contractorId: contractors[2]._id,
      amount: 250,
      estimatedDays: 2,
      message: 'Professional carpenter with electrical experience'
    });
    
    const createdBids = await Bid.insertMany(bids);
    console.log(`Created ${createdBids.length} bids`);
    
    // Calculate rankings for all jobs
    const { calculateAndUpdateRankings } = require('../services/rankingService');
    
    for (const job of jobs) {
      await calculateAndUpdateRankings(job._id);
      console.log(`Calculated rankings for job: ${job.title}`);
    }
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nSample data created:');
    console.log('- 3 Contractors with realistic metrics');
    console.log('- 2 Jobs (1 urgent plumbing, 1 electrical)');
    console.log('- 3 Bids with proper rankings');
    console.log('\nNow you should see dynamic ranking scores instead of static values!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleContractors, sampleJobs };