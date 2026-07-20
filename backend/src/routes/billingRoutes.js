const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const { createCheckoutSession, createPortalSession, getSubscription } = require('../controllers/billingController');

// Note: the Stripe webhook is mounted directly in server.js (it needs the raw
// body for signature verification), not here.

router.get('/subscription', authenticateUser, getSubscription);
router.post('/checkout', authenticateUser, createCheckoutSession);
router.post('/portal', authenticateUser, createPortalSession);

module.exports = router;
