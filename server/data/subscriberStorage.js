import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CryptoJS from 'crypto-js';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

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
const getSubscribers = async () => {
  if (process.env.NODE_ENV === 'production') {
    const querySnapshot = await getDocs(collection(db, 'subscribers'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } else {
    try {
      const data = fs.readFileSync(subscribersFile, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading subscribers file:', err);
      return [];
    }
  }
};

// Add a new subscriber
const addSubscriber = async (email) => {
  const subscribers = await getSubscribers();
  
  // Check if email already exists
  if (subscribers.some(sub => sub.email === email)) {
    throw new Error('Email already subscribed');
  }
  
  const newSubscriber = {
    email,
    avatar: generateAvatarUrl(email),
    isVerified: false,
    subscribedAt: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV === 'production') {
    const docRef = await addDoc(collection(db, 'subscribers'), newSubscriber);
    return { id: docRef.id, ...newSubscriber };
  } else {
    subscribers.push(newSubscriber);
    fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2));
    return newSubscriber;
  }
};

// Remove a subscriber
const removeSubscriber = async (email) => {
  if (process.env.NODE_ENV === 'production') {
    const q = query(collection(db, 'subscribers'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Email not found in subscribers');
    }
    
    // In production, we'll mark as unsubscribed instead of deleting
    const docRef = querySnapshot.docs[0].ref;
    await updateDoc(docRef, { isSubscribed: false, unsubscribedAt: new Date().toISOString() });
    return true;
  } else {
    const subscribers = await getSubscribers();
    const initialLength = subscribers.length;
    
    const updatedSubscribers = subscribers.filter(sub => sub.email !== email);
    
    if (updatedSubscribers.length === initialLength) {
      throw new Error('Email not found in subscribers');
    }
    
    fs.writeFileSync(subscribersFile, JSON.stringify(updatedSubscribers, null, 2));
    return true;
  }
};

// Check if email exists in subscribers
const hasSubscriber = async (email) => {
  if (process.env.NODE_ENV === 'production') {
    const q = query(collection(db, 'subscribers'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } else {
    const subscribers = await getSubscribers();
    return subscribers.some(sub => sub.email === email);
  }
};

// Verify a subscriber's email
const verifySubscriber = async (email) => {
  if (process.env.NODE_ENV === 'production') {
    const q = query(collection(db, 'subscribers'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Subscriber not found');
    }
    
    const docRef = querySnapshot.docs[0].ref;
    await updateDoc(docRef, { 
      isVerified: true,
      verifiedAt: new Date().toISOString()
    });
    
    return true;
  } else {
    const subscribers = await getSubscribers();
    const subscriberIndex = subscribers.findIndex(sub => sub.email === email);
    
    if (subscriberIndex === -1) {
      throw new Error('Subscriber not found');
    }
    
    subscribers[subscriberIndex] = {
      ...subscribers[subscriberIndex],
      isVerified: true,
      verifiedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2));
    return true;
  }
};

export default {
  getSubscribers,
  addSubscriber,
  removeSubscriber,
  hasSubscriber,
  verifySubscriber,
  generateAvatarUrl
};
