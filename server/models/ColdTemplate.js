const mongoose = require("mongoose");

const coldTemplateSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  steps: [{
    order:    { type: Number, required: true },
    subject:  { type: String, required: true },
    body:     { type: String, required: true },
    waitDays: { type: Number, default: 0 },
  }],
  createdAt: { type: Date, default: () => new Date() },
});

module.exports = mongoose.model("ColdTemplate", coldTemplateSchema);
