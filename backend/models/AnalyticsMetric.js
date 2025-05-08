// models/AnalyticsMetric.js
const mongoose = require('mongoose');

const AnalyticsMetricSchema = new mongoose.Schema({
  metric: { type: String, required: true, unique: true },
  percentage: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AnalyticsMetric', AnalyticsMetricSchema);
