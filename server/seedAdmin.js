const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaniq');
    
    // Check if admin exists
    const existingAdmin = await Admin.findOne({ username: 'cleaniqadmin' });
    if (existingAdmin) {
      console.log('Admin already exists! Updating password...');
      existingAdmin.password = 'Pamilerin1980$'; // User's requested password pattern from history
      await existingAdmin.save();
      console.log('Admin password updated successfully!');
      process.exit(0);
    }

    const admin = new Admin({
      username: 'cleaniqadmin',
      password: 'Pamilerin1980$' 
    });

    await admin.save();
    console.log('Admin user cleaniqadmin created successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();
