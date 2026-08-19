'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const { getDashboard } = require('../services/dashboardService');
const { getInsights } = require('../services/insightsService');

const dashboard = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.query);
  res.json({ success: true, data });
});

const insights = asyncHandler(async (req, res) => {
  const data = await getInsights(req.query);
  res.json({ success: true, data });
});

module.exports = { dashboard, insights };
