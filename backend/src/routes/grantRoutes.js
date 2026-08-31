const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middleware/authMiddleware');
const { adminCreateGrantCode, adminGetGrantCodes, adminToggleGrantCode, redeemGrantCode } = require('../controllers/grantController');

// User redeems a grant code
router.post('/redeem', authenticateUser, redeemGrantCode);

// Admin
router.post('/admin/create', authenticateUser, requireAdmin, adminCreateGrantCode);
router.get('/admin/codes', authenticateUser, requireAdmin, adminGetGrantCodes);
router.patch('/admin/codes/:id/toggle', authenticateUser, requireAdmin, adminToggleGrantCode);

module.exports = router;
