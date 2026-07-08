const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

router.get('/', async (req, res) => {
  try {
    const { status, customerId, priority, sort } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (priority) filter.priority = priority;
    const sortOrder = sort === 'createdAt' ? { createdAt: -1 } : { dueDate: 1 };
    const tasks = await Task.find(filter).sort(sortOrder);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: 'done', completedAt: new Date() },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
