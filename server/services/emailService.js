import nodemailer from 'nodemailer';
import { createHash } from 'crypto';

// Generate avatar URL using DiceBear Avataaars
const generateAvatarUrl = (email) => {
  const hash = createHash('md5').update(email).digest('hex');
  return `https://api.dicebear.com/8.x/avataaars/svg?seed=${hash}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

// Create a test account with Mailtrap
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '737ad0f185d183', // Test account credentials
    pass: 'a852909c1c82c9'  // Test account credentials
  }
});

// Function to send welcome email
export const sendWelcomeEmail = async (email, name, quote) => {
  const avatarUrl = generateAvatarUrl(email);
  const unsubscribeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?unsubscribe=${encodeURIComponent(email)}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Welcome to MangaByte, ${name}!`,
    text: `Welcome to MangaByte, ${name}!

Your daily dose of motivation from the world of manga:

"${quote.text}"
— ${quote.character}, ${quote.source}

Your Manga Avatar: ${avatarUrl}

Unsubscribe: ${unsubscribeUrl}
`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h1 style="color: #ff6b9e;">Welcome to MangaByte, ${name}!</h1>
        <p>Thank you for subscribing to MangaByte. Here's your daily dose of motivation from the world of manga:</p>
        <blockquote style="background: #f9f9f9; border-left: 5px solid #ff6b9e; margin: 1.5em 10px; padding: 0.5em 10px;">
          <p style="font-style: italic;">"${quote.text}"</p>
          <footer style="text-align: right; color: #666;">— ${quote.character}, <cite>${quote.source}</cite></footer>
        </blockquote>
        <div style="text-align: center; margin: 20px 0;">
          <img src="${avatarUrl}" alt="Your Manga Avatar" style="width: 150px; height: 150px; border-radius: 50%; border: 3px solid #ff6b9e;" />
        </div>
        <p>We're excited to have you on board! Stay tuned for more manga recommendations and updates.</p>
        <p>If you wish to unsubscribe at any time, simply click the link below:</p>
        <p><a href="${unsubscribeUrl}" style="color: #ff6b9e; text-decoration: none;">Unsubscribe from MangaByte</a></p>
        <p>Best regards,<br>The MangaByte Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return { success: true, avatarUrl };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Function to send goodbye email
export const sendGoodbyeEmail = async (email, name) => {
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

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Goodbye email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending goodbye email:', error);
    throw error;
  }
};

export default {
  sendWelcomeEmail,
  sendGoodbyeEmail
};
