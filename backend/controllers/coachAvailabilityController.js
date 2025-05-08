const Coach = require('../models/Coach');

// GET /api/coaches/:id/availability
exports.getAvailability = async (req, res, next) => {
  try {
    const coach = await Coach.findById(req.params.id);
    if (!coach) return res.status(404).json({ message: 'Coach not found' });
    res.json(coach.availability);
  } catch (err) {
    next(err);
  }
};

// POST /api/coaches/:id/availability
exports.setAvailability = async (req, res, next) => {
  try {
    const coach = await Coach.findByIdAndUpdate(
      req.params.id,
      { availability: req.body.availability },
      { new: true }
    );
    if (!coach) return res.status(404).json({ message: 'Coach not found' });
    res.json(coach);
  } catch (err) {
    next(err);
  }
};
