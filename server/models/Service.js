const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: { type: String, enum: ['UK', 'NG'], required: true },
  rate: { type: Number, required: true },
  type: { type: String, enum: ['hourly', 'flat'], required: true },
  description: String,
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
