const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaniq';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes (To be added)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CleanIQ API is running' });
});

// Import Routes
const bookingRoutes = require('./routes/bookings');
const recruitmentRoutes = require('./routes/recruitment');

app.use('/api/bookings', bookingRoutes);
app.use('/api/recruitment', recruitmentRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
