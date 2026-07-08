const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  contractRef: { type: String, unique: true },
  companyName: { type: String, required: true },
  contactName: String,
  email: { type: String, required: true },
  phone: String,
  address: String,
  service: String,
  frequency: String,
  value: Number,
  monthlyValue: Number,
  startDate: Date,
  endDate: Date,
  renewalDate: Date,
  status: { type: String, enum: ['active', 'expiring-soon', 'expired', 'cancelled', 'draft'], default: 'draft' },
  notes: String,
  autoRenew: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

contractSchema.pre('save', async function (next) {
  if (!this.contractRef) {
    const last = await this.constructor.findOne({}, { contractRef: 1 }).sort({ contractRef: -1 });
    let num = 1;
    if (last && last.contractRef) {
      const match = last.contractRef.match(/CON-(\d+)/);
      if (match) num = parseInt(match[1], 10) + 1;
    }
    this.contractRef = `CON-${String(num).padStart(3, '0')}`;
  }

  if (this.status === 'active' && this.renewalDate) {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const msUntilRenewal = new Date(this.renewalDate) - Date.now();
    if (msUntilRenewal > 0 && msUntilRenewal <= thirtyDaysMs) {
      this.status = 'expiring-soon';
    }
  }

  next();
});

module.exports = mongoose.model('Contract', contractSchema);
