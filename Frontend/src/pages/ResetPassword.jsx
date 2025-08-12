import { useState } from 'react';
import { Eye, EyeOff, Key, Check, X } from 'lucide-react';

const ResetPasswordComponent = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password validation rules
  const validations = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  // Check if passwords match
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // Check if all validations pass
  const allValidationsPassed = Object.values(validations).every(Boolean) && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValidationsPassed) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Password reset successfully!');
    } catch (error) {
      alert('Error resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }) => (
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Create a new password for your account</p>
        </div>

        <div className="space-y-6">
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

            {/* Password Validation Rules */}
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
            type="button"
            onClick={handleSubmit}
            disabled={!allValidationsPassed || isLoading}
            className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all ${
              allValidationsPassed && !isLoading
                ? 'bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Remember your password?{' '}
            <button className="text-blue-500 hover:text-blue-600 font-medium">
              Back to Sign In
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">2025 Masai School. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordComponent;