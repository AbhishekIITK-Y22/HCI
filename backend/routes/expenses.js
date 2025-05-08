const express = require('express');
const router = express.Router();
const { protect, admin, /* turfOwner */ } = require('../middleware/authMiddleware'); // Adjusted path if needed
const {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');

// Middleware to allow Admin or TurfOwner
const adminOrOwner = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'turfOwner')) {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized. Admin or Turf Owner access required.');
    }
};

// All routes require authentication initially
router.use(protect);

// GET /api/expenses - Controller handles role filtering
router.get('/', listExpenses); // Keep accessible to logged-in (controller checks role)

// POST /api/expenses - Only Admin or Owner can create
router.post('/', adminOrOwner, createExpense);

// PUT /api/expenses/:id - Only Admin or Owner can attempt update (controller checks specific permissions)
router.put('/:id', adminOrOwner, updateExpense);

// DELETE /api/expenses/:id - Only Admin can delete
router.delete('/:id', admin, deleteExpense);

module.exports = router;
