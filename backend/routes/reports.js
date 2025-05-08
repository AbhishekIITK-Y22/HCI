const express = require('express');
const { getReportSummary } = require('../controllers/reportController');
const router = express.Router();

router.get('/summary', getReportSummary);

module.exports = router;
