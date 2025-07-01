import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSpinner, FaCheck, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const UnsubscribePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [location]);

  const handleUnsubscribe = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/unsubscribe`, { email });
      if (response.data.success) {
        setIsSuccess(true);
      } else {
        setError(response.data.error || 'Failed to unsubscribe. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred. Please try again later.');
      console.error('Unsubscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-green-500 text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Successfully Unsubscribed</h1>
          <p className="text-gray-600 mb-6">
            You've been successfully unsubscribed from MangaByte. We're sorry to see you go!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You'll no longer receive daily manga quotes at <span className="font-medium">{email}</span>.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 px-4 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
          >
            <FaArrowLeft />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <button
          onClick={() => navigate(-1)}
          className="text-pink-600 hover:text-pink-800 mb-6 flex items-center gap-1 text-sm"
        >
          <FaArrowLeft />
          Back
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribe from MangaByte</h1>
        <p className="text-gray-600 mb-6">
          We're sorry to see you go! Please confirm your email address to unsubscribe from our mailing list.
        </p>

        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="your@email.com"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleUnsubscribe}
          disabled={isLoading || !email}
          className={`w-full py-3 px-4 rounded-md text-white font-medium flex items-center justify-center gap-2 ${
            isLoading ? 'bg-pink-400' : 'bg-pink-600 hover:bg-pink-700'
          } transition-colors`}
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              Processing...
            </>
          ) : (
            'Unsubscribe Me'
          )}
        </button>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Changed your mind? You can always resubscribe by signing up again.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribePage;
