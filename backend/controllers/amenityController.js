const asyncHandler = require('express-async-handler');
const Amenity = require('../models/Amenity');

// @desc    Get all amenities
// @route   GET /api/amenities
// @access  Private (Authenticated users)
exports.getAllAmenities = asyncHandler(async (req, res) => {
    // Sort alphabetically by name for consistent display
    const amenities = await Amenity.find({}).sort('name'); 
    res.status(200).json({ success: true, count: amenities.length, data: amenities });
});

// @desc    Create a new amenity
// @route   POST /api/amenities
// @access  Private (Admin only)
exports.createAmenity = asyncHandler(async (req, res) => {
    const { name, description, icon } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('Amenity name is required');
    }

    // Check if amenity already exists (case-insensitive)
    const amenityExists = await Amenity.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (amenityExists) {
        res.status(400);
        throw new Error('Amenity with this name already exists');
    }

    const amenity = await Amenity.create({ name, description, icon });

    res.status(201).json({ success: true, data: amenity });
});

// @desc    Update an amenity
// @route   PUT /api/amenities/:id
// @access  Private (Admin only)
exports.updateAmenity = asyncHandler(async (req, res) => {
    const { name, description, icon } = req.body;
    const amenity = await Amenity.findById(req.params.id);

    if (!amenity) {
        res.status(404);
        throw new Error('Amenity not found');
    }

    // Check if name is being changed and if the new name already exists
    if (name && name !== amenity.name) {
        const amenityExists = await Amenity.findOne({ name: { $regex: `^${name}$`, $options: 'i' }, _id: { $ne: req.params.id } });
         if (amenityExists) {
            res.status(400);
            throw new Error('Another amenity with this name already exists');
        }
        amenity.name = name;
    }
    
    if (description !== undefined) amenity.description = description;
    if (icon !== undefined) amenity.icon = icon;

    const updatedAmenity = await amenity.save();
    res.status(200).json({ success: true, data: updatedAmenity });
});

// @desc    Delete an amenity
// @route   DELETE /api/amenities/:id
// @access  Private (Admin only)
exports.deleteAmenity = asyncHandler(async (req, res) => {
    const amenity = await Amenity.findById(req.params.id);

    if (!amenity) {
        res.status(404);
        throw new Error('Amenity not found');
    }
    
    // TODO: Consider implications - should deleting an amenity remove it from all venues?
    // For now, we just delete the master amenity record.
    await amenity.remove();

    res.status(200).json({ success: true, message: 'Amenity removed' });
});
