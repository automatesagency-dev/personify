const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
const referralRoutes = require('./routes/referralRoutes');
const billingRoutes = require('./routes/billingRoutes');
const grantRoutes = require('./routes/grantRoutes');
const { handleWebhook } = require('./controllers/billingController');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the first proxy (Railway/hosting) so req.ip reflects the real client IP.
// Without this, express-rate-limit would key every user off the shared proxy IP.
app.set('trust proxy', 1);

// Security headers (HSTS, nosniff, frameguard, hide X-Powered-By, etc.).
// CSP is disabled — this is a JSON API, not an HTML app — and resource policy is
// relaxed to cross-origin so the frontend can load API resources.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

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
// Stripe webhook must receive the raw request body for signature verification,
// so it is mounted BEFORE the JSON body parser.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Personify API is running' });
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
app.use('/api/referral', referralRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/grant', grantRoutes);

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