const mongoose = require('mongoose');
const Service = require('./models/Service');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaniq';

const initialServices = [
  // UK Services (Hourly)
  { name: 'Classic Regular', region: 'UK', rate: 17.90, type: 'hourly', description: 'Regular recurring home cleaning service' },
  { name: 'Classic One-off', region: 'UK', rate: 20.90, type: 'hourly', description: 'One-time home cleaning session' },
  { name: 'Deep Clean', region: 'UK', rate: 24.90, type: 'hourly', description: 'Thorough deep cleaning of your entire home' },
  { name: 'Holiday Rental', region: 'UK', rate: 21.90, type: 'hourly', description: 'Specialist Airbnb & holiday rental cleaning' },
  { name: 'Office Cleaning', region: 'UK', rate: 19.90, type: 'hourly', description: 'Professional office and commercial cleaning' },
  
  // Nigeria Services (Flat Rates)
  { name: '1 Bed Flat', region: 'NG', rate: 15000, type: 'flat', description: '1 bedroom apartment cleaning' },
  { name: '2 Bed Flat', region: 'NG', rate: 22000, type: 'flat', description: '2 bedroom apartment cleaning' },
  { name: '3 Bed House', region: 'NG', rate: 35000, type: 'flat', description: '3 bedroom house cleaning' },
  { name: '4 Bed House', region: 'NG', rate: 45000, type: 'flat', description: '4 bedroom house cleaning' },
  { name: '5+ Bed House', region: 'NG', rate: 60000, type: 'flat', description: '5+ bedroom large house cleaning' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');
    
    for (const service of initialServices) {
      await Service.findOneAndUpdate(
        { name: service.name, region: service.region },
        service,
        { upsert: true }
      );
    }
    
    console.log('✅ Services seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
