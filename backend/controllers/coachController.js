const Coach = require('../models/Coach');
const User = require('../models/User');

exports.getCoaches = async (req, res, next) => {
  try {
    const coaches = await Coach.find().populate('user', 'name email');
    res.json(coaches);
  } catch (err) {
    next(err);
  }
};

exports.getCoachById = async (req, res, next) => {
  try {
    const coach = await Coach.findById(req.params.id).populate('user', 'name email');
    if (!coach) return res.status(404).json({ message: 'Coach not found' });
    res.json(coach);
  } catch (err) {
    next(err);
  }
};

exports.createCoach = async (req, res, next) => {
  try {
    const { user, bio, availability } = req.body;
    const existingCoach = await Coach.findOne({ user });
    if (existingCoach) return res.status(400).json({ message: 'Coach profile already exists for this user' });
    const coach = await Coach.create({ user, bio, availability });
 

    res.status(201).json(coach);
  } catch (err) {
    next(err);
  }
};

exports.updateCoach = async (req, res, next) => {
  try {
    const coach = await Coach.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coach) return res.status(404).json({ message: 'Coach not found' });
    res.json(coach);
  } catch (err) {
    next(err);
  }
};

exports.deleteCoach = async (req, res, next) => {
  try {
    const coach = await Coach.findByIdAndDelete(req.params.id);
    if (!coach) return res.status(404).json({ message: 'Coach not found' });
    res.json({ message: 'Coach removed' });
  } catch (err) {
    next(err);
  }
};
