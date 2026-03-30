const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const upload = require('../config/upload');
const { uploadImage } = require('../controllers/uploadController');

router.post('/image', authenticateUser, upload.single('image'), uploadImage);

module.exports = router;