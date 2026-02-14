const express = require('express');
const {
  generateImage,
  generateText,
  getGenerations,
  getGenerationById,
  deleteGeneration
} = require('../controllers/generationController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { checkUsageLimits } = require('../middleware/usageLimits');

const router = express.Router();

// All routes are protected
router.use(authenticateUser);

// Generation routes (with usage limits)
router.post('/image', checkUsageLimits, generateImage);
router.post('/text', checkUsageLimits, generateText);

// History routes (no limits)
router.get('/', getGenerations);
router.get('/:id', getGenerationById);
router.delete('/:id', deleteGeneration);

module.exports = router;