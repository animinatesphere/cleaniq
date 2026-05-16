const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Service = require('./models/Service');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cleaniq';

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    const services = await Service.find({ name: /Living/i });
    console.log('Services found:', JSON.stringify(services, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
