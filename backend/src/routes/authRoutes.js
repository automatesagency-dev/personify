const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateUser, getMe);

module.exports = router;