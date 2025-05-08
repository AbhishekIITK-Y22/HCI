const express = require('express');
const router = express.Router();
const Tariff = require('../models/Tariff');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all tariffs (optionally filter by venue)
router.get('/', protect, async (req, res) => {
  const filters = {};
  if (req.query.venue) filters.venue = req.query.venue;

  const tariffs = await Tariff.find(filters).populate('venue', 'name location');
  res.json(tariffs);
});

// Create a new tariff
router.post('/', protect, admin, async (req, res) => {
  const tariff = await Tariff.create(req.body);
  res.status(201).json(tariff);
});

// Update a tariff
router.put('/:id', protect, admin, async (req, res) => {
  const updated = await Tariff.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete a tariff
router.delete('/:id', protect, admin, async (req, res) => {
  await Tariff.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
