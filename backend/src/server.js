const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { prisma, testConnection } = require('./config/database');
const { testOpenAIConnection } = require('./config/openai');
const authRoutes = require('./routes/authRoutes');
const personaRoutes = require('./routes/personaRoutes');
const generationRoutes = require('./routes/generationRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Personify API is running' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ 
      status: 'OK', 
      message: 'Database connected',
      userCount 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Auth routes
app.use('/api/auth', authRoutes);

// Persona routes
app.use('/api/persona', personaRoutes);

// Generation routes
app.use('/api/generate', generationRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await testConnection();
  await testOpenAIConnection();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});