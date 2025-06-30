import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEnvelope, FaHeart, FaUserNinja, FaBook, FaSpinner } from 'react-icons/fa';

// Configure axios to use the backend URL
const API_BASE_URL = 'http://localhost:3001/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

const App: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [avatarSeed, setAvatarSeed] = useState('');

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
      setError('Please enter an email address');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/subscribe', { email });
      if (response.data.success) {
        setRandomQuote(response.data.quote);
        setAvatarSeed(response.data.avatarUrl);
        setIsSubscribed(true);
      } else {
        setError(response.data.error || 'Subscription failed. Please try again.');
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(
          <span>
            This email is already subscribed. 
            <button 
              onClick={() => {
                setEmail(email);
                setIsSubscribed(true);
                handleUnsubscribe();
              }}
              className="ml-1 text-pink-600 hover:underline font-medium"
            >
              Unsubscribe?
            </button>
          </span>
        );
      } else {
        setError(err.response?.data?.error || 'Failed to subscribe. Please try again later.');
      }
      console.error('Subscription error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email) {
      setError('No email address to unsubscribe');
      return;
    }
    
    if (!window.confirm('Are you sure you want to unsubscribe from MangaByte? You\'ll stop receiving daily manga motivation.')) {
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/unsubscribe', { email });
      if (response.data.success) {
        setIsSubscribed(false);
        setEmail('');
        setRandomQuote(null);
        setAvatarSeed('');
      } else {
        setError(response.data.error || 'Unsubscription failed. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                         (err.response?.status === 404 ? 'This email is not subscribed.' : 
                         'Failed to unsubscribe. Please try again later.');
      setError(errorMessage);
      console.error('Unsubscription error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-700 flex items-center">
            <FaHeart className="text-pink-500 mr-2" />
            MangaByte
          </h1>
          {isSubscribed && (
            <button
              onClick={handleUnsubscribe}
              className="text-sm text-gray-600 hover:text-red-600 transition-colors flex items-center"
              disabled={isLoading}
            >
              <FaEnvelope className="mr-1" />
              {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <p className="text-gray-600">
              {isSubscribed 
                ? "Here's your daily manga motivation!" 
                : "Get motivational manga moments delivered to your inbox."}
            </p>
          </div>

        <div className="card">
          {!isSubscribed ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-purple-300" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="your@email.com"
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
                className="btn-primary w-full flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subscribing...
                  </>
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
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-pink-200">
                  <img 
                    src={avatarSeed} 
                    alt="Anime avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-2xl font-bold text-purple-700 mb-2">You're subscribed! <span className="text-pink-500">❤️</span></h2>
                <p className="text-gray-600 mb-2">Check your email for daily manga motivation!</p>
              </div>
              
              {randomQuote && (
                <div className="bg-purple-50 rounded-xl p-4 mb-6 text-left">
                  <blockquote className="text-gray-700 italic mb-2">"{randomQuote.text}"</blockquote>
                  <div className="flex items-center text-sm text-purple-600">
                    <FaUserNinja className="mr-1" />
                    <span className="font-medium mr-3">{randomQuote.character}</span>
                    <FaBook className="mr-1" />
                    <span>{randomQuote.source}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleUnsubscribe}
                className="btn-secondary mt-4 w-full flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          Made with <span className="text-pink-500">♥</span> for manga lovers
        </div>
      </div>
    </main>
  </div>
  );
};

export default App;
