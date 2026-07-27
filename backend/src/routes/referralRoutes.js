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
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/use', authenticateUser, useCode);
router.get('/my-code', authenticateUser, getMyCode);
router.get('/earnings', authenticateUser, getReferralEarnings);

router.get('/admin/stats', authenticateUser, adminGetStats);
router.post('/admin/generate', authenticateUser, adminGenerateCodes);
router.get('/admin/codes', authenticateUser, adminGetCodes);
router.patch('/admin/codes/:id/toggle', authenticateUser, adminToggleCode);

module.exports = router;
