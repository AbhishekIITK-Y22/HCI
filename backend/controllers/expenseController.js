const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');
const Venue = require('../models/Venue'); // Needed for owner checks

// @desc    List expenses, filtered by role and optionally month & year
// @route   GET /api/expenses?month=&year=&venueId=
// @access  Private (Admin/Owner)
exports.listExpenses = asyncHandler(async (req, res) => {
    const { month, year, venueId } = req.query;
    let filter = {};

    // Date Filter
    if (month && year) {
        const m = parseInt(month, 10) - 1; // JS months 0–11
        const y = parseInt(year, 10);
        if (!isNaN(m) && !isNaN(y) && m >= 0 && m < 12) {
            const start = new Date(y, m, 1);
            const end = new Date(y, m + 1, 1);
            filter.date = { $gte: start, $lt: end };
        } else {
             console.warn('Invalid month/year provided for expense filtering.');
        }
    }

    // Role-Based Filter
    if (req.user.role === 'admin') {
        // Admin sees all (or filtered by optional venueId query param)
        if (venueId) {
            filter.venueId = venueId;
        }
    } else if (req.user.role === 'turfOwner') {
        // Owner sees expenses only for their venues
        const ownerVenues = await Venue.find({ owner: req.user._id }).select('_id');
        const ownerVenueIds = ownerVenues.map(v => v._id);
        
        // If a specific venueId is requested by owner, ensure it's theirs
        if (venueId) {
            if (!ownerVenueIds.some(id => id.equals(venueId))) {
                res.status(403); 
                throw new Error('Not authorized to view expenses for this venue');
            }
            filter.venueId = venueId;
        } else {
            // Otherwise, show expenses for ALL their venues
            filter.venueId = { $in: ownerVenueIds };
        }
    } else {
        // Other roles cannot list expenses via this route
        res.status(403);
        throw new Error('Not authorized to access expenses');
    }
    
    // Ensure recordedBy filter isn't accidentally overwritten if needed later
    // filter.recordedBy = req.user._id; // Example if filtering by recorder needed

    const expenses = await Expense.find(filter)
                                 .populate('venueId', 'name location') // Populate venue name
                                 .populate('userId', 'name') // Populate user who recorded
                                 .sort({ date: -1 });
    res.status(200).json({ success: true, count: expenses.length, data: expenses }); // Standardize response
});

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private (Admin/Owner)
exports.createExpense = asyncHandler(async (req, res) => {
    const { date, amount, category, description, venueId } = req.body;

    if (!date || amount == null || !category) {
        res.status(400);
        throw new Error('Date, amount, and category are required');
    }
    if (amount <= 0) {
         res.status(400);
         throw new Error('Amount must be positive');
    }

    let expenseData = {
        userId: req.user._id, // Automatically set recorder
        date,
        amount,
        category,
        description,
    };

    // Handle venue association based on role
    if (req.user.role === 'admin') {
        // Admin can optionally assign to any venue
        if (venueId) {
            const venueExists = await Venue.findById(venueId);
            if (!venueExists) {
                res.status(400); throw new Error('Venue not found');
            }
            expenseData.venueId = venueId;
        }
    } else if (req.user.role === 'turfOwner') {
        // Owner MUST associate with one of their venues
        if (!venueId) {
             res.status(400);
             throw new Error('Venue ID is required for Turf Owners');
        }
        const venue = await Venue.findOne({ _id: venueId, owner: req.user._id });
        if (!venue) {
            res.status(403);
            throw new Error('Not authorized to add expense for this venue');
        }
        expenseData.venueId = venueId;
    } else {
         // Other roles cannot create expenses via this route
         res.status(403);
         throw new Error('Not authorized to create expenses');
    }

    const expense = await Expense.create(expenseData);
    
    // Populate response for consistency
    const populatedExpense = await Expense.findById(expense._id)
                                          .populate('venueId', 'name')
                                          .populate('userId', 'name');
                                          
    res.status(201).json({ success: true, data: populatedExpense });
});

// @desc    Update an existing expense
// @route   PUT /api/expenses/:id
// @access  Private (Admin or Owner of Venue/Expense)
exports.updateExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        res.status(404);
        throw new Error('Expense not found');
    }

    // Authorization Check:
    let isAuthorized = false;
    if (req.user.role === 'admin') {
        isAuthorized = true;
    } else if (req.user.role === 'turfOwner') {
        // Check if owner recorded it OR owns the associated venue
        if (expense.userId.equals(req.user._id)) {
            isAuthorized = true;
        } else if (expense.venueId) {
            const venue = await Venue.findOne({ _id: expense.venueId, owner: req.user._id });
            if (venue) {
                isAuthorized = true;
            }
        }
    } else { 
         // Check if the user recorded the expense (maybe allow self-edit?)
         // if (expense.userId.equals(req.user._id)) { isAuthorized = true; }
    }
    
    if (!isAuthorized) {
        res.status(403);
        throw new Error('Not authorized to update this expense');
    }

    // Proceed with update
    const { date, amount, category, description, venueId } = req.body;
    
    expense.date = date ?? expense.date;
    expense.amount = amount ?? expense.amount;
    expense.category = category ?? expense.category;
    expense.description = description ?? expense.description;
    // Potentially allow changing venue if admin or owner?
    // For now, let's assume venue doesn't change easily after creation.
    // if (venueId) expense.venueId = venueId; 

    const updatedExpense = await expense.save();
    const populatedExpense = await Expense.findById(updatedExpense._id)
                                          .populate('venueId', 'name')
                                          .populate('userId', 'name');
                                          
    res.status(200).json({ success: true, data: populatedExpense });
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Admin (Route enforces Admin, extra check added)
exports.deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        res.status(404);
        throw new Error('Expense not found');
    }
    
    // Double check authorization although route has middleware
    // Could add Owner check here too if desired, modifying route middleware
    if (req.user.role !== 'admin') { 
        // Example: Allow owner to delete expenses for their venue
        /*
        let isAuthorized = false;
        if (req.user.role === 'turfOwner' && expense.venueId) {
             const venue = await Venue.findOne({ _id: expense.venueId, owner: req.user._id });
             if (venue) isAuthorized = true;
        }
        if (!isAuthorized) {
            res.status(403);
            throw new Error('Not authorized to delete this expense');
        }
        */
        res.status(403);
        throw new Error('Only Admins can delete expenses via this endpoint.');
    }

    await expense.remove(); // Use remove() which triggers middleware if any
    // await Expense.findByIdAndDelete(req.params.id); // Alternative direct delete

    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
});
