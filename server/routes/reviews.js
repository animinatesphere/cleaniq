const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a review
router.post('/', async (req, res) => {
  const { customerName, rating, comment } = req.body;
  try {
    const review = new Review({ customerName, rating, comment });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update review status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a review
router.delete('/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/google — live Google rating, review count and latest reviews for the website
// (utils/googleReviews.js). 204 when the Google key isn't set, so the site uses its built-in reviews.
router.get('/google', async (req, res) => {
  try {
    const data = await require('../utils/googleReviews').getReviews();
    if (!data) return res.status(204).end();
    res.set('Cache-Control', 'public, max-age=600');
    res.json(data);
  } catch (err) {
    console.error('[google-reviews]', err.message);
    res.status(204).end();
  }
});

module.exports = router;
