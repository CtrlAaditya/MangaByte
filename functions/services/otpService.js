import { sendOTPEmail } from './emailService.js';
import { saveOTP, verifyOTP as verifyOTPStorage, isSubscribed } from './inMemoryStorage.js';

const OTP_EXPIRY_MINUTES = 10;
const OTP_COLLECTION = 'otpVerifications';

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in memory with expiry
export const createAndSendOTP = async (email) => {
  try {
    // Check if user is already subscribed
    const subscribed = await isSubscribed(email);
    if (subscribed) {
      return { success: true, alreadyVerified: true };
    }

    // Generate and store new OTP
    const otp = generateOTP();
    await saveOTP(email, otp);

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return { success: true, otpSent: true };
  } catch (error) {
    console.error('Error creating OTP:', error);
    throw new Error('Failed to send verification code');
  }
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
  try {
    const result = await verifyOTPStorage(email, otp);
    
    if (!result.valid) {
      return { success: false, error: result.error };
    }

    return { 
      success: true, 
      message: result.message,
      isNewSubscriber: result.isNewSubscriber
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error('Failed to verify code');
  }
};
