import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FaEnvelope, 
  FaHeart, 
  FaUserNinja, 
  FaBook, 
  FaSpinner, 
  FaArrowLeft,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import OTPVerification from './components/OTPVerification';
import UnsubscribePage from './pages/UnsubscribePage';

// Configure axios to use the backend URL
const API_BASE_URL = 'http://localhost:3001';
const api = axios.create({
  baseURL: API_BASE_URL, // Removed /api from here
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  // Add this to handle relative URLs correctly
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Resolve only if the status code is less than 500
  }
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Response Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

interface Quote {
  text: string;
  character: string;
  source: string;
}

const quotes: Quote[] = [
  {
    text: "It's not the face that makes someone a monster, it's the choices they make with their lives.",
    character: "Naruto Uzumaki",
    source: "Naruto"
  },
  {
    text: "I am the hope of the universe. I am the answer to all living things that cry out for peace.",
    character: "Son Goku",
    source: "Dragon Ball Z"
  },
  {
    text: "Hard work is worthless for those that don't believe in themselves.",
    character: "Naruto Uzumaki",
    source: "Naruto"
  },
  {
    text: "If you don't take risks, you can't create a future!",
    character: "Monkey D. Luffy",
    source: "One Piece"
  },
  {
    text: "The world is not beautiful, and that, in a way, lends it a sort of beauty.",
    character: "Kino",
    source: "Kino's Journey"
  }
];

interface SubscriptionState {
  email: string;
  isSubscribed: boolean;
  isVerifying: boolean;
  isLoading: boolean;
  error: React.ReactNode;
  quote: Quote | null;
  avatarUrl: string;
}

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<SubscriptionState>({
    email: '',
    isSubscribed: false,
    isVerifying: false,
    isLoading: false,
    error: '',
    quote: null,
    avatarUrl: ''
  });

  // Check for unsubscribe parameter in URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const unsubscribeEmail = params.get('unsubscribe');
    
    if (unsubscribeEmail) {
      // Decode the email in case it was URL-encoded
      const decodedEmail = decodeURIComponent(unsubscribeEmail);
      updateState({ 
        email: decodedEmail,
        isVerifying: false,
        isSubscribed: true // Assume they are subscribed if they're trying to unsubscribe
      });
      
      // Auto-scroll to the unsubscribe button for better UX
      setTimeout(() => {
        const unsubscribeBtn = document.getElementById('unsubscribe-btn');
        if (unsubscribeBtn) {
          unsubscribeBtn.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, []);
  
  const { email, isSubscribed, isVerifying, isLoading, error, quote, avatarUrl } = state;
  
  const updateState = (updates: Partial<SubscriptionState>) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  };

  const getRandomQuote = (): Quote => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const generateAvatarSeed = (email: string): string => {
    return email.split('@')[0] || 'manga';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple email validation
    if (!email) {
      updateState({ error: 'Please enter an email address' });
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      updateState({ error: 'Please enter a valid email address' });
      return;
    }

    updateState({ isLoading: true, error: '' });

    try {
      console.log('Sending OTP to:', email);
      // First, check if we need to verify with OTP
      const otpResponse = await api.post('/api/send-otp', { email });
      console.log('OTP Response:', otpResponse.data);
      
      if (otpResponse.data.verified) {
        console.log('Email already verified, subscribing directly');
        // Already verified, subscribe directly
        const response = await api.post('/api/subscribe', { email });
        console.log('Subscribe response:', response.data);
        updateState({
          isSubscribed: true,
          quote: response.data.quote,
          avatarUrl: response.data.avatarUrl,
          isLoading: false
        });
      } else {
        console.log('Email not verified, showing OTP verification');
        // Need to verify with OTP
        updateState({
          isVerifying: true,
          isLoading: false
        });
      }
    } catch (err: any) {
      console.error('Subscription error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data
        }
      });
      
      if (err.response?.status === 409) {
        updateState({
          error: (
            <span>
              This email is already subscribed. 
              <button 
                onClick={handleUnsubscribe}
                className="ml-1 text-pink-600 hover:underline font-medium"
              >
                Unsubscribe?
              </button>
            </span>
          ),
          isLoading: false
        });
      } else {
        const errorMessage = err.response?.data?.error || 
                           err.message || 
                           'Failed to subscribe. Please try again later.';
        updateState({
          error: errorMessage,
          isLoading: false
        });
      }
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    updateState({ isLoading: true, error: '' });
    
    try {
      const response = await api.post('/api/verify-otp', { email, otp });
      
      if (response.data.success) {
        // OTP verified, complete subscription
        const subscribeResponse = await api.post('/api/subscribe', { email });
        updateState({
          isSubscribed: true,
          isVerifying: false,
          isLoading: false,
          quote: subscribeResponse.data.quote,
          avatarUrl: subscribeResponse.data.avatarUrl
        });
        return true;
      } else {
        throw new Error(response.data.error || 'Verification failed');
      }
    } catch (err: any) {
      updateState({
        error: err.response?.data?.error || 'Invalid verification code. Please try again.',
        isLoading: false
      });
      throw err;
    }
  };

  const handleResendOTP = async () => {
    try {
      await api.post('/api/send-otp', { email });
      return true;
    } catch (err) {
      updateState({
        error: 'Failed to resend verification code. Please try again.',
        isLoading: false
      });
      throw err;
    }
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm('Are you sure you want to unsubscribe? You will stop receiving daily manga quotes.')) {
      return;
    }

    updateState({ isLoading: true, error: '' });

    try {
      console.log('Attempting to unsubscribe email:', email);
      const response = await api.post('/api/unsubscribe', { email });
      console.log('Unsubscribe response:', response.data);
      
      updateState({
        email: '',
        isSubscribed: false,
        isVerifying: false,
        isLoading: false,
        quote: null,
        avatarUrl: ''
      });
    } catch (err: any) {
      console.error('Detailed unsubscribe error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data
        }
      });
      
      const errorMessage = err.response?.data?.error || 
                         (err.response?.status === 404 ? 'This email is not subscribed.' : 
                         `Failed to unsubscribe. ${err.message || 'Please try again later.'}`);
      
      updateState({
        error: errorMessage,
        isLoading: false
      });
    }
  };

  const handleBackToForm = () => {
    updateState({
      isVerifying: false,
      error: ''
    });
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <OTPVerification
            email={email}
            onBack={handleBackToForm}
            onVerify={handleVerifyOTP}
            resendOTP={handleResendOTP}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">MangaByte</h1>
          <p className="text-lg text-gray-600">Get your daily dose of manga motivation</p>
        </div>

        {!isSubscribed ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  className="focus:ring-pink-500 focus:border-pink-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => updateState({ email: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className="mt-1 text-sm text-red-500">
                  {typeof error === 'string' ? error : error}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" />
                  Subscribing...
                </span>
              ) : (
                'Subscribe Now'
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              No spam, just pure manga motivation! Unsubscribe anytime.
            </p>
          </form>
        ) : (
          <div className="text-center">
            <div className="mt-8 text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="User avatar"
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <FaUserNinja className="text-4xl text-pink-500" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
              <p className="text-gray-600 mb-6">Your daily manga quotes are on their way to {email}</p>
              
              {quote && (
                <div className="bg-pink-50 p-4 rounded-lg mb-6">
                  <p className="italic text-gray-800">"{quote.text}"</p>
                  <p className="text-right text-sm text-gray-600 mt-2">— {quote.character}, {quote.source}</p>
                </div>
              )}
              
              <button
                id="unsubscribe-btn"
                type="button"
                onClick={handleUnsubscribe}
                className="mt-4 w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  'Unsubscribe from MangaByte'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-12 text-center text-sm text-gray-500">
        Made with <span className="text-pink-500">♥</span> for manga lovers
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
};

export default App;
