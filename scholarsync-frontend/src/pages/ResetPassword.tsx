import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Key, Check, X } from 'lucide-react';
import { put } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';
import { ROUTE_CONSTANTS } from '@/constants/routeConstants';
import type { ApiResponse } from '@/types/common.types';

interface ValidationItemProps {
  isValid: boolean;
  text: string;
}

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string>('');

  // Password validation states
  const [, setHasMinLength] = useState<boolean>(false);
  const [, setHasUppercase] = useState<boolean>(false);
  const [, setHasLowercase] = useState<boolean>(false);
  const [, setHasNumber] = useState<boolean>(false);
  const [, setHasSpecialChar] = useState<boolean>(false);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean>(false);

  // Password validation rules
  const validations = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  // Check if passwords match
  const passwordsMatchFirst = password && confirmPassword && password === confirmPassword;

  // Check if all validations pass
  const allValidationsPassed = Object.values(validations).every(Boolean) && passwordsMatchFirst;

  // Update password validations when password changes
  useEffect(() => {
    setHasMinLength(password.length >= 8);
    setHasUppercase(/[A-Z]/.test(password));
    setHasLowercase(/[a-z]/.test(password));
    setHasNumber(/[0-9]/.test(password));
    setHasSpecialChar(/[!@#$%^&*(),.?":{}|<>]/.test(password));
    setPasswordsMatch(password === confirmPassword && confirmPassword !== '');
  }, [password, confirmPassword]);

  // Simulate initial page loading with skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Check validations
    if (!allValidationsPassed) return;

    try {
      setIsLoading(true);
      await put<ApiResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD(token!), {
        password
      });

      toast.success('Password reset successfully');
      navigate(ROUTE_CONSTANTS.LOGIN);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      if (err.response?.data?.message === 'Invalid or expired token') {
        setTokenError('This password reset link has expired or is invalid. Please request a new one.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to reset password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ValidationItem component
  const ValidationItem: React.FC<ValidationItemProps> = ({ isValid, text }) => (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
        isValid ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
      }`}>
        {isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      </div>
      <span className={isValid ? 'text-green-600' : 'text-gray-500'}>
        {text}
      </span>
    </div>
  );

  // Skeleton loader component
  const ResetPasswordSkeleton = () => (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 border border-gray-100 animate-pulse">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-gray-300 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-300 w-3/4 mx-auto rounded-md mb-2"></div>
        <div className="h-4 bg-gray-200 w-2/3 mx-auto rounded-md"></div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 w-1/3 rounded-md"></div>
          <div className="h-12 bg-gray-200 w-full rounded-lg"></div>
        </div>

        <div className="space-y-2">
          <div className="h-4 bg-gray-300 w-1/3 rounded-md"></div>
          <div className="h-12 bg-gray-200 w-full rounded-lg"></div>
        </div>

        <div className="h-12 bg-gray-300 w-full rounded-lg"></div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="h-4 bg-gray-200 w-2/3 mx-auto rounded-md"></div>
      </div>

      <div className="mt-6 text-center">
        <div className="h-3 bg-gray-200 w-3/4 mx-auto rounded-md"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-indigo-500 to-purple-900 p-4 sm:p-6 md:p-8">
      {pageLoading ? (
        <ResetPasswordSkeleton />
      ) : tokenError ? (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Link Expired</h2>
          <p className="text-gray-600 mb-6">{tokenError}</p>
          <button
            onClick={() => navigate(ROUTE_CONSTANTS.LOGIN)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request New Reset Link
          </button>
          <div className="mt-4">
            <button
              onClick={() => navigate(ROUTE_CONSTANTS.HOME)}
              className="text-blue-600 hover:underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 border border-gray-100 transition-all duration-300 hover:shadow-blue-500/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
                <Key className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 text-transparent bg-clip-text mb-2">
              Reset Password
            </h1>
            <p className="text-gray-600">
              Create a new password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {password && (
                <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg">
                  <ValidationItem isValid={validations.minLength} text="At least 8 characters" />
                  <ValidationItem isValid={validations.hasUppercase} text="At least one uppercase letter (A-Z)" />
                  <ValidationItem isValid={validations.hasLowercase} text="At least one lowercase letter (a-z)" />
                  <ValidationItem isValid={validations.hasNumber} text="At least one number (0-9)" />
                  <ValidationItem isValid={validations.hasSpecialChar} text="At least one special character (!@#$%^&*)" />
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-0 transition-colors ${
                    confirmPassword && !passwordsMatch
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Match Validation */}
              {confirmPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      passwordsMatch ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </div>
                    <span className={passwordsMatch ? 'text-green-600' : 'text-red-600'}>
                      {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || password !== confirmPassword || !allValidationsPassed}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting Password...
                </div>
              ) : (
                <>
                  Reset Password
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <button
                  onClick={() => navigate(ROUTE_CONSTANTS.LOGIN)}
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-gray-500 text-xs">
              <p>
                {new Date().getFullYear()} ScholarSync. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
