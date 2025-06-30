import express from 'express';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import mangaFacts from './data/mangaFacts.js';
import subscriberStorage from './data/subscriberStorage.js';
import { sendWelcomeEmail, sendGoodbyeEmail } from './services/emailService.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { createHash } from 'crypto';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
      if (subscriberStorage.hasSubscriber(email)) {
        return res.status(409).json({ 
          success: false,
          error: 'This email is already subscribed' 
        });
      }
      
      // Add subscriber
      subscriberStorage.addSubscriber(email);
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
        error: error.message || 'Failed to process subscription' 
      });
    }
  }
);

app.post(
  '/api/unsubscribe',
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
      // Check if email exists before attempting to remove
      if (!subscriberStorage.hasSubscriber(email)) {
        return res.status(404).json({ 
          success: false,
          error: 'This email is not in our subscription list' 
        });
      }
      
      // Remove subscriber
      await subscriberStorage.removeSubscriber(email);
      
      // Send goodbye email
      await sendGoodbyeEmail(email, 'Manga Fan');
      
      res.status(200).json({ 
        success: true,
        message: 'Successfully unsubscribed from MangaByte' 
      });
    } catch (error) {
      console.error('Unsubscription error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to process unsubscription' 
      });
    }
  }
);

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
