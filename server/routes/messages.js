const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Worker = require('../models/Worker');
const { sendEmail, templates } = require('../utils/emailService');

// GET chat thread with specific worker
router.get('/worker/:workerId', async (req, res) => {
  try {
    const messages = await Message.find({ workerId: req.params.workerId })
      .sort({ createdAt: 1 }) // oldest first for message list
      .limit(100);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST send message
router.post('/', async (req, res) => {
  try {
    const { senderType, workerId, senderName, text } = req.body;
    
    if (!workerId || !text) {
      return res.status(400).json({ error: 'workerId and text are required' });
    }

    const message = new Message({
      senderType,
      workerId,
      senderName,
      text
    });

    await message.save();

    // Send notifications based on sender type
    try {
      const staff = await Worker.findById(workerId);
      if (staff) {
        if (senderType === 'Admin') {
          // Send support email notification to Staff member
          console.log(`💬 Admin message sent to staff ${staff.firstName} ${staff.lastName}. Sending notification...`);
          await sendEmail({
            to: staff.email,
            subject: `💬 New message from Cleaniq Admin`,
            html: templates.newChatMessageToStaffAlert(staff, senderName, text)
          });
        } else {
          // Send support email notification to Admin
          console.log(`💬 Staff ${staff.firstName} sent message to Admin. Sending notification...`);
          await sendEmail({
            to: process.env.EMAIL_USER || 'admin@cleaniqservices.com',
            subject: `💬 Support Chat Message from ${staff.firstName} ${staff.lastName}`,
            html: templates.newChatMessageToAdminAlert(staff, text)
          });
        }
      }
    } catch (emailErr) {
      console.error('❌ Failed to send support message email notification:', emailErr);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET list of active worker threads (for admin layout sidebar / thread view)
router.get('/active-threads', async (req, res) => {
  try {
    // Find unique workerIds that have sent or received messages
    const threadData = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$workerId',
          lastMessage: { $first: '$text' },
          lastMessageTime: { $first: '$createdAt' },
          lastSender: { $first: '$senderType' }
        }
      },
      { $sort: { lastMessageTime: -1 } }
    ]);

    // Populate worker details manually
    const populatedThreads = await Promise.all(threadData.map(async (t) => {
      const worker = await Worker.findById(t._id).select('firstName lastName email status region phone');
      return {
        ...t,
        worker
      };
    }));

    // Filter threads where worker is found
    res.json(populatedThreads.filter(t => t.worker));
  } catch (error) {
    console.error('Error fetching active threads:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
