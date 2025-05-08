const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    userId: { // User who incurred/logged the expense
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    venueId: { // Optional: Link expense to a specific venue
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        index: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true
    },
    category: { // Changed 'type' to 'category' for clarity
        type: String,
        required: true
    },
    description: String
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);