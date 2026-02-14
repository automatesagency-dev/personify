const express = require('express');
const {
  createPersona,
  getPersona,
  uploadPersonaImage,
  deletePersonaImage,
  deletePersona
} = require('../controllers/personaController');
const { authenticateUser } = require('../middleware/authMiddleware');
const upload = require('../config/upload');

const router = express.Router();

// All routes are protected (require authentication)
router.use(authenticateUser);

// Persona routes
router.post('/', createPersona);
router.get('/', getPersona);
router.delete('/', deletePersona);

// Image routes
router.post('/images', upload.single('image'), uploadPersonaImage);
router.delete('/images/:imageId', deletePersonaImage);

module.exports = router;