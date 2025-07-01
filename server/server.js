import express from 'express';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import mangaFacts from './data/mangaFacts.js';
// Import in-memory storage functions
import { isSubscribed, unsubscribe, getSubscribers } from './services/inMemoryStorage.js';
import { sendWelcomeEmail, sendGoodbyeEmail } from './services/emailService.js';
import { createAndSendOTP, verifyOTP } from './services/otpService.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { createHash } from 'crypto';
// Import Firebase instance from config
import { db } from './config/firebase.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
const allowedOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      console.error(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Enable CORS first
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ status: 'ok', message: 'Test endpoint working' });
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Get a random manga fact
export const getRandomFact = () => {
  return mangaFacts[Math.floor(Math.random() * mangaFacts.length)];
};

// Get top manga titles from facts
const getTopMangaTitles = () => {
  const titleCounts = mangaFacts.reduce((acc, fact) => {
    acc[fact.source] = (acc[fact.source] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(titleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title]) => title);
};

// OTP Verification Endpoints
app.post('/api/send-otp', 
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail()
  ],
  async (req, res) => {
    console.log('Received send-otp request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: errors.array()[0].msg 
      });
    }

    const { email } = req.body;

    try {
      const result = await createAndSendOTP(email);
      if (result.alreadyVerified) {
        return res.json({ 
          success: true, 
          message: 'Email already verified',
          verified: true
        });
      }
      res.json({ 
        success: true, 
        message: 'Verification code sent to your email' 
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send verification code' 
      });
    }
  }
);

app.post('/api/verify-otp',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits')
      .isNumeric()
      .withMessage('Verification code must be numeric')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: errors.array()[0].msg 
      });
    }

    const { email, otp } = req.body;

    try {
      console.log('Verifying OTP for:', email);
      const result = await verifyOTP(email, otp);
      
      if (!result.success) {
        console.log('OTP verification failed:', result.error);
        return res.status(400).json(result);
      }
      
      console.log('OTP verified successfully for:', email);
      
      // Send welcome email with a random manga fact
      const quote = getRandomFact();
      console.log('Sending welcome email to:', email);
      await sendWelcomeEmail(email, email.split('@')[0], quote);
      
      console.log('Subscription completed for:', email);
      res.json({ 
        success: true, 
        message: 'Email verified successfully',
        quote,
        avatarUrl: `https://api.dicebear.com/8.x/avataaars/svg?seed=${createHash('md5').update(email).digest('hex')}&radius=50`
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to verify code' 
      });
    }
  }
);

// Routes
app.get('/api/status', (req, res) => {
  const subscribers = subscriberStorage.getSubscribers();
  const topTitles = getTopMangaTitles();
  
  res.json({
    status: 'active',
    subscribers: subscribers.length,
    topMangaTitles: topTitles
  });
});

app.post(
  '/api/subscribe',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: errors.array()[0].msg 
      });
    }

    const { email } = req.body;

    try {
      // Check if already subscribed
      if (isSubscribed(email)) {
        return res.status(409).json({ 
          success: false,
          error: 'This email is already subscribed' 
        });
      }
      
      // Get a quote
      const quote = getRandomFact();
      
      // Send welcome email
      const result = await sendWelcomeEmail(email, 'Manga Fan', quote);
      
      res.status(200).json({ 
        success: true,
        message: 'Subscription successful!', 
        quote,
        avatarUrl: result.avatarUrl 
      });
    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to process subscription',
        details: error.message 
      });
    }
  }
);

// Unsubscribe endpoint
app.post(
  '/api/unsubscribe',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail()
  ],
  async (req, res) => {
    try {
      console.log('Unsubscribe request received:', req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Check if email exists before attempting to remove
      const isUserSubscribed = await isSubscribed(email);
      if (!isUserSubscribed) {
        console.log('Not subscribed:', email);
        return res.status(404).json({ error: 'Email is not subscribed' });
      }

      // Remove subscriber
      await unsubscribe(email);

      // Send goodbye email
      console.log('Sending goodbye email to:', email);
      await sendGoodbyeEmail(email, email.split('@')[0]);

      console.log('Unsubscription successful for:', email);
      res.json({ 
        success: true,
        message: 'Successfully unsubscribed' 
      });
    } catch (error) {
      console.error('Unsubscription error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to process unsubscription',
        details: error.message 
      });
    }
  }
);

// Status endpoint
app.get('/api/status', (req, res) => {
  try {
    const subscribers = getSubscribers();
    const topTitles = getTopMangaTitles();
    
    res.json({
      status: 'active',
      subscribers: subscribers.size, // Using size for Set
      topMangaTitles: topTitles
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to get status',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- POST   /api/subscribe`);
  console.log(`- POST   /api/unsubscribe`);
  console.log(`- GET    /api/status`);
});

export default app;
