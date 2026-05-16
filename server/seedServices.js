const mongoose = require('mongoose');
const Service = require('./models/Service');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaniq';

const initialServices = [
  // UK Services (Hourly)
  { name: 'Residential Cleaning', region: 'UK', rate: 17.90, type: 'hourly', description: 'Regular recurring home cleaning service' },
  { name: 'Classic One-off', region: 'UK', rate: 20.90, type: 'hourly', description: 'One-time home cleaning session' },
  { name: 'Deep Clean', region: 'UK', rate: 24.90, type: 'hourly', description: 'Thorough deep cleaning of your entire home' },
  { name: 'Airbnb Cleaning', region: 'UK', rate: 21.90, type: 'hourly', description: 'Specialist Airbnb & holiday rental cleaning' },
  { name: 'Office Cleaning', region: 'UK', rate: 19.90, type: 'hourly', description: 'Professional office and commercial cleaning' },
  { name: 'End of Tenancy', region: 'UK', rate: 29.90, type: 'hourly', description: 'Deep cleaning for move-in/move-out with deposit guarantee' },
  
  // Nigeria Services (Flat Rates)
  { name: '1 Bed Flat', region: 'NG', rate: 15000, type: 'flat', description: '1 bedroom apartment cleaning' },
  { name: '2 Bed Flat', region: 'NG', rate: 22000, type: 'flat', description: '2 bedroom apartment cleaning' },
  { name: '3 Bed House', region: 'NG', rate: 35000, type: 'flat', description: '3 bedroom house cleaning' },
  { name: '4 Bed House', region: 'NG', rate: 45000, type: 'flat', description: '4 bedroom house cleaning' },
  { name: '5+ Bed House', region: 'NG', rate: 60000, type: 'flat', description: '5+ bedroom large house cleaning' },
  { name: 'End of Tenancy', region: 'NG', rate: 30000, type: 'flat', description: 'Deep cleaning for move-in/move-out with deposit guarantee' },

  // UK Extras (Flat Rate)
  { name: 'American fridge freeze', region: 'UK', rate: 15, type: 'flat', description: 'Deep clean for American style fridge freezer' },
  { name: 'Carpet(s) Cleaning', region: 'UK', rate: 30, type: 'flat', description: 'Professional carpet cleaning per room' },
  { name: 'Double Oven Cleaning', region: 'UK', rate: 20, type: 'flat', description: 'Thorough cleaning of double oven' },
  { name: 'Fridge and freezer', region: 'UK', rate: 18, type: 'flat', description: 'Standard fridge and freezer cleaning' },
  { name: 'Range Oven Cleaning', region: 'UK', rate: 25, type: 'flat', description: 'Industrial size range oven cleaning' },
  { name: 'Single fridge', region: 'UK', rate: 10, type: 'flat', description: 'Standard single fridge cleaning' },
  { name: 'Single Oven Cleaning', region: 'UK', rate: 15, type: 'flat', description: 'Standard oven cleaning' },
  { name: 'Venetian Blinds', region: 'UK', rate: 5, type: 'flat', description: 'Meticulous cleaning of venetian blinds' },

  // Rooms (Informational)
  { name: 'Bedroom', region: 'UK', rate: 0, type: 'flat', description: 'Informational room count' },
  { name: 'Bathroom', region: 'UK', rate: 0, type: 'flat', description: 'Informational room count' },
  { name: 'Kitchen', region: 'UK', rate: 0, type: 'flat', description: 'Informational room count' },
  { name: 'Living Room', region: 'UK', rate: 0, type: 'flat', description: 'Informational room count' },

  // Nigeria Extras (Flat Rate)
  { name: 'American fridge freeze', region: 'NG', rate: 8000, type: 'flat', description: 'Deep clean for American style fridge freezer' },
  { name: 'Carpet(s) Cleaning', region: 'NG', rate: 15000, type: 'flat', description: 'Professional carpet cleaning per room' },
  { name: 'Double Oven Cleaning', region: 'NG', rate: 12000, type: 'flat', description: 'Thorough cleaning of double oven' },
  { name: 'Fridge and freezer', region: 'NG', rate: 10000, type: 'flat', description: 'Standard fridge and freezer cleaning' },
  { name: 'Range Oven Cleaning', region: 'NG', rate: 15000, type: 'flat', description: 'Industrial size range oven cleaning' },
  { name: 'Single fridge', region: 'NG', rate: 5000, type: 'flat', description: 'Standard single fridge cleaning' },
  { name: 'Single Oven Cleaning', region: 'NG', rate: 8000, type: 'flat', description: 'Standard oven cleaning' },
  { name: 'Venetian Blinds', region: 'NG', rate: 3000, type: 'flat', description: 'Meticulous cleaning of venetian blinds' },

  // Rooms (Informational)
  { name: 'Bedroom', region: 'NG', rate: 0, type: 'flat', description: 'Informational room count' },
  { name: 'Bathroom', region: 'NG', rate: 0, type: 'flat', description: 'Informational room count' },
  { name: 'Kitchen', region: 'NG', rate: 0, type: 'flat', description: 'Informational room count' },
  { name: 'Living Room', region: 'NG', rate: 0, type: 'flat', description: 'Informational room count' },
];

async function seed() {
  console.log('Attempting to connect to:', MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
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
