import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { createHash } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// OAuth2 Client Setup
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Generate manga-style avatar URL using DiceBear Avataaars
const generateAvatarUrl = (email) => {
  const hash = createHash('md5').update(email).digest('hex');
  // Simple and reliable avatar with minimal parameters
  return `https://api.dicebear.com/8.x/avataaars/svg?seed=${hash}&radius=50`;
};

// Create transporter based on environment
const createTransporter = async () => {
  // For development - use Gmail SMTP with app password
  if (process.env.NODE_ENV !== 'production') {
    console.log('Using Gmail SMTP with app password for email service');
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_EMAIL || 'aadityakhillare68@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'txnrjdrjikowzvpm'
      },
      tls: {
        rejectUnauthorized: false // Only for development
      }
    });
  }
  
  // Production - use OAuth2 (keep existing config)
  const accessToken = await oAuth2Client.getAccessToken();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GOOGLE_EMAIL,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken.token
    }
  });
};

// Function to send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'aadityakhillare68@gmail.com',
      to: email,
      subject: 'Your MangaByte Verification Code',
      text: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h1 style="color: #ff6b9e;">Verify Your Email</h1>
          <p>Your verification code is:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; padding: 10px; background: #f5f5f5; text-align: center; border-radius: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

// Function to send welcome email
export const sendWelcomeEmail = async (email, name, quote) => {
  try {
    const transporter = await createTransporter();
    const avatarUrl = generateAvatarUrl(email);
    const unsubscribeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'aadityakhillare68@gmail.com',
      to: email,
      subject: `Welcome to MangaByte, ${name || 'Manga Fan'}!`,
      text: `Welcome to MangaByte, ${name || 'Manga Fan'}!

Your daily dose of motivation from the world of manga:

"${quote.text}"
— ${quote.character}, ${quote.source}

Your Manga Avatar: ${avatarUrl}

Unsubscribe: ${unsubscribeUrl}
`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff6b9e; margin: 0;">Welcome to MangaByte!</h1>
            <p style="color: #666; margin: 5px 0 20px 0;">${name || 'Manga Fan'}, your daily dose of manga awaits</p>
          </div>
          
          <div style="background: #fff8fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <p>Here's your daily manga motivation:</p>
            <blockquote style="background: #fff; border-left: 4px solid #ff6b9e; margin: 15px 0; padding: 15px; border-radius: 0 8px 8px 0;">
              <p style="font-style: italic; margin: 0 0 10px 0; font-size: 1.1em; color: #333;">"${quote.text}"</p>
              <footer style="text-align: right; color: #ff6b9e; font-weight: bold;">— ${quote.character}</footer>
              <p style="text-align: right; margin: 5px 0 0 0; color: #888; font-size: 0.9em;">${quote.source}</p>
            </blockquote>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <img src="${avatarUrl}" alt="Your Manga Avatar" style="width: 150px; height: 150px; border-radius: 50%; border: 3px solid #ff6b9e; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 20px;">We're excited to have you on board! Here's what you can expect:</p>
            <ul style="text-align: left; display: inline-block; margin: 0; padding: 0 20px;">
              <li style="margin-bottom: 8px;">📖 Daily manga quotes and wisdom</li>
              <li style="margin-bottom: 8px;">🎭 Character spotlights and backstories</li>
              <li style="margin-bottom: 8px;">✨ Exclusive content and recommendations</li>
            </ul>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <p style="margin: 0 0 15px 0; font-size: 0.9em; color: #666;">Not feeling it? No hard feelings!</p>
            <a href="${unsubscribeUrl}" style="background-color: #ff4d6d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 0.9em;">
              Unsubscribe from MangaByte
            </a>
            <p style="margin: 10px 0 0 0; font-size: 0.8em; color: #999;">Or copy this link: ${unsubscribeUrl}</p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #666;">Connect with us:</p>
            <div style="margin-bottom: 15px;">
              <a href="#" style="margin: 0 10px; color: #ff6b9e; text-decoration: none;">Twitter</a>
              <a href="#" style="margin: 0 10px; color: #ff6b9e; text-decoration: none;">Instagram</a>
              <a href="#" style="margin: 0 10px; color: #ff6b9e; text-decoration: none;">Discord</a>
            </div>
            <p style="margin: 0; font-size: 0.8em; color: #999;">© ${new Date().getFullYear()} MangaByte. All rights reserved.</p>
            <p style="margin: 5px 0 0 0; font-size: 0.7em; color: #bbb;">
              You're receiving this email because you signed up at MangaByte.
              <br>
              <a href="${unsubscribeUrl}" style="color: #bbb; text-decoration: underline;">Unsubscribe</a> | 
              <a href="#" style="color: #bbb; text-decoration: underline;">Manage Preferences</a>
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, avatarUrl };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Function to send goodbye email
export const sendGoodbyeEmail = async (email, name) => {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Sorry to see you go!',
      text: `We're sad to see you go, ${name}!

You've been unsubscribed from MangaByte.

If this was a mistake, you can resubscribe at any time at ${process.env.FRONTEND_URL || 'http://localhost:3000'}

Best regards,
The MangaByte Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h1 style="color: #ff6b9e;">We're sad to see you go, ${name}!</h1>
          <p>You've been unsubscribed from MangaByte.</p>
          <p>If this was a mistake, you can <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #ff6b9e;">resubscribe here</a>.</p>
          <p>Best regards,<br>The MangaByte Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Goodbye email sent to ${email}`);
    return info;
  } catch (error) {
    console.error('Error sending goodbye email:', error);
    throw error;
  }
};

export default {
  sendWelcomeEmail,
  sendGoodbyeEmail,
  sendOTPEmail
};
