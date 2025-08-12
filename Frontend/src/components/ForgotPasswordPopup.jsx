import { useState } from 'react';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';
import axios from 'axios';

const ForgotPasswordPopup = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Start cooldown timer
  const startCooldown = () => {
    setResendCooldown(180); // 180 seconds (3 minutes) cooldown
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // First check if the email exists using the public auth endpoint
      const checkResponse = await axios.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      
      if (checkResponse.data.exists) {
        // Email exists, proceed with password reset
        const response = await axios.post('/auth/forgot-password', { email });
        setIsEmailSent(true);
        startCooldown(); // Start the cooldown timer for the first email
        toast.success(response.data.message);
      } else {
        // Email doesn't exist
        toast.error('No account found with this email address. Please check and try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 404) {
        toast.error('No account found with this email address. Please check and try again.');
      } else {
        toast.error(error.response?.data?.message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
          disabled={isLoading}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEmailSent ? 'Check Your Email' : 'Reset Your Password'}
            </h2>
            <p className="text-gray-600 mt-2">
              {isEmailSent 
                ? `We've sent a password reset link to ${email}. Please check your inbox or spam folder.`
                : 'Enter your email and we\'ll send you a link to reset your password.'}
            </p>
          </div>

          {!isEmailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="space-y-1">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {/* Space reserved for validation indicators */}
                  <div className="min-h-[20px] flex items-start">
                    {/* Add your validation indicators here */}
                    {/* Example: 
                    {emailError && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {emailError}
                      </p>
                    )}
                    {emailValid && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Valid email address
                      </p>
                    )}
                    */}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Didn't receive the email? Resend again:
              </p>
              <div className="flex flex-col space-y-3 mb-6">
                <button
                  onClick={async () => {
                    if (isResending || resendCooldown > 0) return;
                    setIsResending(true);
                    try {
                      await axios.post('/auth/forgot-password', { email });
                      startCooldown(); // Start the cooldown timer after resend
                      toast.success('A new reset link has been sent to your email.');
                    } catch (error) {
                      toast.error(error.response?.data?.message || 'Failed to resend. Please try again.');
                    } finally {
                      setIsResending(false);
                    }
                  }}
                  disabled={isResending || resendCooldown > 0}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                    isResending || resendCooldown > 0
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                  } transition-colors`}
                >
                  {isResending 
                    ? 'Sending...' 
                    : resendCooldown > 0 
                      ? `Resend in ${formatTime(resendCooldown)}` 
                      : 'Resend Reset Link'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPopup;