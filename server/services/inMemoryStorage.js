// Simple in-memory storage for development
const storage = {
  otps: new Map(),
  subscribers: new Set()
};

export const saveOTP = (email, otp) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry
  
  storage.otps.set(email, {
    otp,
    expiresAt
  });
  
  console.log(`OTP for ${email}: ${otp}`); // Log OTP to console for testing
  return Promise.resolve(true);
};

export const verifyOTP = (email, otp) => {
  const otpData = storage.otps.get(email);
  
  if (!otpData) {
    return Promise.resolve({ valid: false, error: 'No OTP found for this email' });
  }
  
  if (new Date() > otpData.expiresAt) {
    storage.otps.delete(email);
    return Promise.resolve({ valid: false, error: 'OTP has expired' });
  }
  
  if (otpData.otp !== otp) {
    return Promise.resolve({ valid: false, error: 'Invalid OTP' });
  }
  
  // OTP is valid
  storage.otps.delete(email);
  storage.subscribers.add(email);
  
  return Promise.resolve({ 
    valid: true,
    message: 'Email verified successfully',
    isNewSubscriber: true
  });
};

export const isSubscribed = (email) => {
  return Promise.resolve(storage.subscribers.has(email));
};

export const unsubscribe = (email) => {
  storage.subscribers.delete(email);
  return Promise.resolve(true);
};

export const getSubscribers = () => {
  return storage.subscribers;
};
