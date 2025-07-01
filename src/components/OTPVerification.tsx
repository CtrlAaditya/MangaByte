import React, { useState, useEffect } from 'react';
import { FaSpinner, FaArrowLeft, FaCheck } from 'react-icons/fa';

interface OTPVerificationProps {
  email: string;
  onBack: () => void;
  onVerify: (otp: string) => Promise<boolean>;
  resendOTP: () => Promise<boolean>;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  onBack,
  onVerify,
  resendOTP,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Handle countdown for resend OTP button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (value && !/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);
    setError('');

    // Auto-focus to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    } else if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await onVerify(otpString);
      if (!success) {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendDisabled) return;
    
    setIsResending(true);
    setError('');
    
    try {
      const handleResend = async () => {
        setResendDisabled(true);
        setCountdown(60);

        try {
          const success = await resendOTP();
          if (!success) {
            setError('Failed to resend code. Please try again.');
            setResendDisabled(false);
          }
        } catch (err) {
          setError('Failed to resend code. Please try again.');
          setResendDisabled(false);
        }
      };
      await handleResend();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
      >
        <FaArrowLeft className="mr-1" /> Back
      </button>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
      <p className="text-gray-600 mb-6">
        We've sent a 6-digit verification code to <span className="font-semibold">{email}</span>.
        Please enter it below to continue.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="flex justify-between mb-6 space-x-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 h-14 text-2xl text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            disabled={isLoading}
          />
        ))}
      </div>
      
      <button
        onClick={handleVerify}
        disabled={isLoading || otp.some(d => d === '')}
        className={`w-full py-3 px-4 rounded-md text-white font-medium flex items-center justify-center ${
          isLoading || otp.some(d => d === '')
            ? 'bg-pink-300 cursor-not-allowed'
            : 'bg-pink-600 hover:bg-pink-700'
        }`}
      >
        {isLoading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Verifying...
          </>
        ) : (
          <>
            <FaCheck className="mr-2" />
            Verify & Subscribe
          </>
        )}
      </button>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          Didn't receive a code?{' '}
          <button
            onClick={handleResendOTP}
            disabled={resendDisabled || isResending}
            className={`font-medium ${
              resendDisabled || isResending
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-pink-600 hover:text-pink-700'
            }`}
          >
            {isResending ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-1" /> Sending...
              </span>
            ) : resendDisabled ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend code'
            )}
          </button>
        </p>
      </div>
    </div>
  );
};

export default OTPVerification;
