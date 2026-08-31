const express = require('express');
const router = express.Router();
const {
  useCode,
  getMyCode,
  adminGenerateCodes,
  adminGetCodes,
  adminToggleCode,
  adminGetStats,
  getReferralEarnings
} = require('../controllers/referralController');
const { authenticateUser, requireAdmin } = require('../middleware/authMiddleware');

router.post('/use', authenticateUser, useCode);
router.get('/my-code', authenticateUser, getMyCode);
router.get('/earnings', authenticateUser, getReferralEarnings);

router.get('/admin/stats', authenticateUser, requireAdmin, adminGetStats);
router.post('/admin/generate', authenticateUser, requireAdmin, adminGenerateCodes);
router.get('/admin/codes', authenticateUser, requireAdmin, adminGetCodes);
router.patch('/admin/codes/:id/toggle', authenticateUser, requireAdmin, adminToggleCode);

module.exports = router;
