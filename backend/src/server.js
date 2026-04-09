const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { prisma, testConnection } = require('./config/database');
const { testOpenAIConnection } = require('./config/ai');
const { testFalConnection } = require('./config/fal');
const authRoutes = require('./routes/authRoutes');
const personaRoutes = require('./routes/personaRoutes');
const generationRoutes = require('./routes/generationRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const founderPageRoutes = require('./routes/founderPageRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL || '').split(',').map(o => o.trim()).filter(Boolean)
  : true;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked: ${origin}`));
        }
      }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Password reset routes
app.use('/api/auth', passwordResetRoutes);

// Persona routes
app.use('/api/persona', personaRoutes);

// Generation routes
app.use('/api/generate', generationRoutes);

app.use('/api/founder-page', founderPageRoutes);

app.use('/api/upload', require('./routes/upload'));

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await testConnection();
  await testOpenAIConnection();
  await testFalConnection();
  console.log('✅ Server is ready and listening...');
});

// Error handling
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use!`);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});