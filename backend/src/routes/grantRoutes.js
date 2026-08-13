const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const { adminCreateGrantCode, adminGetGrantCodes, adminToggleGrantCode, redeemGrantCode } = require('../controllers/grantController');

// User redeems a grant code
router.post('/redeem', authenticateUser, redeemGrantCode);

// Admin
router.post('/admin/create', authenticateUser, adminCreateGrantCode);
router.get('/admin/codes', authenticateUser, adminGetGrantCodes);
router.patch('/admin/codes/:id/toggle', authenticateUser, adminToggleGrantCode);

module.exports = router;
