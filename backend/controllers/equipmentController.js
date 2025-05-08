// controllers/equipmentController.js
const Equipment = require('../models/Equipment');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

// Helper to validate ObjectId
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// @desc    List all equipment across all turfs (Admin)
// @route   GET /api/equipment
// @access  Admin
exports.listAll = asyncHandler(async (req, res, next) => {
  const allEquipment = await Equipment.find()
      .populate('currentUser', 'name email')
      .populate('venue', 'name location');
  res.status(200).json({ success: true, count: allEquipment.length, data: allEquipment });
});

// @desc    List all available equipment across all turfs
// @route   GET /api/equipment/available
// @access  Private (Authenticated)
exports.listAvailable = asyncHandler(async (req, res, next) => {
  const availableEquipment = await Equipment.find({ status: 'available' })
      .populate('venue', 'name location');
  res.status(200).json({ success: true, count: availableEquipment.length, data: availableEquipment });
});

// @desc    List all checked-out equipment across all turfs (Admin)
// @route   GET /api/equipment/checkedout
// @access  Admin
exports.listCheckedOut = asyncHandler(async (req, res, next) => {
  const checkedOut = await Equipment.find({ status: 'checkedout' })
    .populate('currentUser', 'name email')
    .populate('venue', 'name location');
  res.status(200).json({ success: true, count: checkedOut.length, data: checkedOut });
});

// @desc    List equipment CHECKED OUT BY the authenticated user (Player)
// @route   GET /api/equipment/my
// @access  Player
exports.myCheckedOut = asyncHandler(async (req, res, next) => {
  const myItems = await Equipment.find({
    status: 'checkedout',
    currentUser: req.user._id
  }).populate('venue', 'name location');
  res.status(200).json({ success: true, count: myItems.length, data: myItems });
});

// @desc    List all equipment FOR a specific venue (Turf Owner/Admin)
// @route   GET /api/equipment/venue/:venueId 
// @access  Turf Owner/Admin (Middleware should check ownership)
exports.listByVenue = asyncHandler(async (req, res, next) => {
  const { venueId } = req.params;
  if (!isValidId(venueId)) {
    return res.status(400).json({ success: false, message: 'Invalid venueId' });
  }
  const equipment = await Equipment.find({ venue: venueId })
      .populate('venue', 'name location')
      .populate('currentUser', 'name email')
      .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: equipment.length, data: equipment });
});

// @desc    List available equipment FOR a specific venue
// @route   GET /api/equipment/venue/:venueId/available 
// @access  Private
exports.listAvailableByVenue = asyncHandler(async (req, res, next) => {
  const { venueId } = req.params;
  if (!isValidId(venueId)) {
    return res.status(400).json({ success: false, message: 'Invalid venueId' });
  }
  const available = await Equipment.find({ venue: venueId, status: 'available' });
  res.status(200).json({ success: true, count: available.length, data: available });
});

// @desc    Checkout equipment (Player)
// @route   POST /api/equipment/checkout 
// @access  Player
exports.checkout = asyncHandler(async (req, res, next) => {
  const { equipmentId } = req.body;
  
  if (!equipmentId || !isValidId(equipmentId)) {
    return res.status(400).json({ success: false, message: 'Valid equipmentId is required' });
  }

  const eq = await Equipment.findById(equipmentId);
  
  if (!eq) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
  }
  
  if (eq.status === 'checkedout') {
    return res.status(400).json({ success: false, message: 'Equipment is already checked out' });
  }

  eq.status = 'checkedout';
  eq.currentUser = req.user._id;
  await eq.save();

  const populatedEq = await Equipment.findById(eq._id)
      .populate('currentUser', 'name email')
      .populate('venue', 'name');
      
  res.status(200).json({ success: true, data: populatedEq });
});

// @desc    Checkin equipment (Player)
// @route   POST /api/equipment/checkin
// @access  Player
exports.checkin = asyncHandler(async (req, res, next) => {
  const { equipmentId } = req.body;

  if (!equipmentId || !isValidId(equipmentId)) {
    return res.status(400).json({ success: false, message: 'Valid equipmentId is required' });
  }

  const eq = await Equipment.findById(equipmentId);
  
  if (!eq) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
  }

  if (eq.status !== 'checkedout') {
      return res.status(400).json({ success: false, message: 'Equipment is not checked out' });
  }
  
  if (String(eq.currentUser) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Cannot check in equipment checked out by another user' });
  }

  eq.status = 'available';
  eq.currentUser = null;
  await eq.save();

  res.status(200).json({ success: true, data: eq });
});

// --- Admin/Owner Equipment Management ---

// @desc    Add new equipment to a venue
// @route   POST /api/equipment
// @access  Admin or TurfOwner
exports.addEquipment = asyncHandler(async (req, res) => {
    const { name, venueId, rentalPrice, description, condition } = req.body;

    if (!name || !venueId || !rentalPrice) {
        return res.status(400).json({ success: false, message: 'Name, VenueID, and Rental Price are required.' });
    }
    if (!isValidId(venueId)) {
        return res.status(400).json({ success: false, message: 'Invalid Venue ID.' });
    }

    const newEquipment = await Equipment.create({
        name,
        venue: venueId,
        rentalPrice,
        description,
        condition,
        status: 'available',
    });
    res.status(201).json({ success: true, data: newEquipment });
});

// @desc    Update equipment details
// @route   PUT /api/equipment/:equipmentId
// @access  Admin or TurfOwner
exports.updateEquipment = asyncHandler(async (req, res) => {
    const { equipmentId } = req.params;
    const { name, rentalPrice, description, condition, status } = req.body;

    if (!isValidId(equipmentId)) {
        return res.status(400).json({ success: false, message: 'Invalid Equipment ID.' });
    }

    const updatedEquipment = await Equipment.findByIdAndUpdate(
        equipmentId,
        { name, rentalPrice, description, condition, status },
        { new: true, runValidators: true }
    );

    if (!updatedEquipment) {
        return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    res.status(200).json({ success: true, data: updatedEquipment });
});

// @desc    Delete equipment
// @route   DELETE /api/equipment/:equipmentId
// @access  Admin or TurfOwner
exports.deleteEquipment = asyncHandler(async (req, res) => {
    const { equipmentId } = req.params;

    if (!isValidId(equipmentId)) {
        return res.status(400).json({ success: false, message: 'Invalid Equipment ID.' });
    }

    const deletedEquipment = await Equipment.findByIdAndDelete(equipmentId);

    if (!deletedEquipment) {
        return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    res.status(200).json({ success: true, message: 'Equipment deleted successfully.' });
});
