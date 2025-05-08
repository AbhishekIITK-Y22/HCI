const { validationResult } = require('express-validator');

const validationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors for a cleaner response
    const formattedErrors = errors.array().map(err => ({ 
        field: err.param, 
        message: err.msg 
    }));
    return res.status(400).json({ success: false, errors: formattedErrors });
  }
  next();
};

module.exports = validationHandler; 