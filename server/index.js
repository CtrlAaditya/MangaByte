import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import { sendWelcomeEmail } from './services/emailService.js';
import { generateOTP, verifyOTP } from './services/otpService.js';
import { subscribe, unsubscribe, isSubscribed } from './services/inMemoryStorage.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.post('/api/send-otp', 
  [
    body('email').isEmail().normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      await generateOTP(email);
      
      res.status(200).json({ 
        success: true, 
        message: 'OTP sent successfully' 
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send OTP',
        details: error.message 
      });
    }
  }
);

app.post('/api/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, otp } = req.body;
      const isValid = await verifyOTP(email, otp);
      
      if (isValid) {
        // Subscribe the user
        await subscribe(email);
        
        // Send welcome email
        await sendWelcomeEmail(email, '', {
          text: 'Welcome to MangaByte!',
          character: 'MangaByte Team',
          source: 'MangaByte'
        });
        
        return res.status(200).json({ 
          success: true, 
          message: 'OTP verified and subscription successful' 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid OTP' 
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to verify OTP',
        details: error.message 
      });
    }
  }
);

app.post('/api/unsubscribe',
  [
    body('email').isEmail().normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      
      // Check if email exists before attempting to remove
      const isUserSubscribed = await isSubscribed(email);
      if (!isUserSubscribed) {
        return res.status(404).json({ 
          success: false,
          error: 'Email is not subscribed' 
        });
      }

      // Remove subscriber
      await unsubscribe(email);
      
      res.status(200).json({ 
        success: true, 
        message: 'Successfully unsubscribed' 
      });
    } catch (error) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to unsubscribe',
        details: error.message 
      });
    }
  }
);

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
