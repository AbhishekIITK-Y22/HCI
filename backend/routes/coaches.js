const express = require('express');
const router = express.Router();
const {
  getCoaches,
  getCoachById,
  createCoach,
  updateCoach,
  deleteCoach
} = require('../controllers/coachController');

const { protect, admin, coachOnly } = require('../middleware/authMiddleware');

// 🟢 Public-facing route (optional auth if needed)
// You could remove protect here if everyone can see coaches
router.get('/', protect, getCoaches);
const Coach = require('../models/Coach');
router.get('/me/profile', protect, coachOnly, async (req, res, next) => {
  try {
    const coachProfile = await Coach.findOne({ user: req.user._id }).populate('user');
    if (!coachProfile) return res.status(404).json({ message: 'Coach profile not found' });
    res.json(coachProfile);
  } catch (err) {
    next(err);
  }
});
router.get('/:id', protect, getCoachById);

// 🔒 Admin-only for managing coach profiles
router.post('/', protect, admin, createCoach);
router.put('/:id', protect, admin, updateCoach);
router.delete('/:id', protect, admin, deleteCoach);

// 🆕 Optional: route for coaches to fetch their own profile
// (e.g., /api/coaches/me)


module.exports = router;
