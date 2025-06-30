// Email configuration using environment variables
// Mailtrap SMTP Configuration (for testing)
// Visit https://mailtrap.io/ to see your test emails
// No account needed - using test credentials

export default {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  from: process.env.EMAIL_FROM
};
