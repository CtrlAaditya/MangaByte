import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CryptoJS from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const subscribersFile = path.join(__dirname, 'subscribers.json');

// Initialize subscribers file if it doesn't exist
if (!fs.existsSync(subscribersFile)) {
  fs.writeFileSync(subscribersFile, JSON.stringify([], null, 2));
}

// Generate a simple avatar URL using DiceBear's avataaars
const generateAvatarUrl = (email) => {
  // Create a consistent seed from the email
  const seed = CryptoJS.MD5(email).toString();
  return `https://avatars.dicebear.com/api/avataaars/${seed}.svg?mood[]=happy&background=%23f0f9ff`;
};

// Read all subscribers
const getSubscribers = () => {
  try {
    const data = fs.readFileSync(subscribersFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading subscribers file:', err);
    return [];
  }
};

// Add a new subscriber
const addSubscriber = (email) => {
  const subscribers = getSubscribers();
  
  // Check if email already exists
  if (subscribers.some(sub => sub.email === email)) {
    throw new Error('Email already subscribed');
  }
  
  const newSubscriber = {
    email,
    avatar: generateAvatarUrl(email),
    subscribedAt: new Date().toISOString()
  };
  
  subscribers.push(newSubscriber);
  fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2));
  
  return newSubscriber;
};

// Remove a subscriber
const removeSubscriber = (email) => {
  const subscribers = getSubscribers();
  const initialLength = subscribers.length;
  
  const updatedSubscribers = subscribers.filter(sub => sub.email !== email);
  
  if (updatedSubscribers.length === initialLength) {
    throw new Error('Email not found');
  }
  
  fs.writeFileSync(subscribersFile, JSON.stringify(updatedSubscribers, null, 2));
  return true;
};

// Check if email exists in subscribers
const hasSubscriber = (email) => {
  const subscribers = getSubscribers();
  return subscribers.some(sub => sub.email === email);
};

export default {
  getSubscribers,
  addSubscriber,
  removeSubscriber,
  hasSubscriber,
  generateAvatarUrl
};
