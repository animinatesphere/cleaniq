const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderType: { 
    type: String, 
    enum: ['Worker', 'Admin'], 
    required: true 
  },
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Worker', 
    required: true 
  },
  senderName: { 
    type: String, 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create index for fast retrieval of threads
messageSchema.index({ workerId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
