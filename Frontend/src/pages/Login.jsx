import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import ForgotPasswordPopup from "../components/ForgotPasswordPopup";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Simulate initial page loading with skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Skeleton loader component
  const LoginSkeleton = () => (
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
          <div className="h-4 bg-gray-300 w-1/4 rounded-md"></div>
          <div className="h-12 bg-gray-200 w-full rounded-lg"></div>
        </div>

        <div className="space-y-2">
          <div className="h-4 bg-gray-300 w-1/4 rounded-md"></div>
          <div className="h-12 bg-gray-200 w-full rounded-lg"></div>
          <div className="flex justify-between items-center mt-1">
            <div className="h-4 bg-gray-200 w-1/4 rounded-md"></div>
            <div className="h-4 bg-gray-200 w-1/4 rounded-md"></div>
          </div>
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
        <LoginSkeleton />
      ) : (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 border border-gray-100 transition-all duration-300 hover:shadow-blue-500/20">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center space-x-1.5 mb-4">
                <div className="h-10 w-10 transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="h-full w-full object-contain"
                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                  />
                </div>
                <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-blue-500 to-indigo-900 text-transparent bg-clip-text -mb-1" style={{fontFamily: 'Times New Roman, Times, serif'}}>
                  ScholarSync
                </h1>
              </div>
              <p className="text-gray-800 -mt-1">
                Welcome back! Sign in to your account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200 group-hover:border-blue-300"
                />

                {email && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200 group-hover:border-blue-300"
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-xs text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="font-small text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                <>
                  Sign In
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-6">
              <button 
                onClick={() => setShowAuthPopup(true)}
                className="flex items-center justify-center p-2 border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"
                    fill="#4285F4"
                  />
                  <path
                    d="M4.17 14.595l3.258-2.538c-.75-2.199-3.18-3.355-5.624-2.605-2.445.75-3.6 3.18-2.85 5.625.75 2.445 3.179 3.6 5.624 2.85a4.723 4.723 0 0 0 2.05-1.162l-2.458-2.17z"
                    fill="#34A853"
                  />
                  <path
                    d="M12 20.571c2.24 0 4.12-.747 5.496-2.019l-2.665-2.073c-.748.997-1.91 1.57-3.16 1.57-2.207 0-4.067-1.49-4.727-3.494h-2.59v2.187A8.33 8.33 0 0 0 12 20.571z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M7.273 13.414a5.073 5.073 0 0 1 0-3.214v-2.187H4.17a8.52 8.52 0 0 0 0 7.588l3.103-2.187z"
                    fill="#EA4335"
                  />
                </svg>
              </button>
              <button 
                onClick={() => setShowAuthPopup(true)}
                className="flex items-center justify-center p-2 border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="h-5 w-5 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M24 12.073c0-5.962-4.825-10.788-10.787-10.788-5.962 0-10.787 4.826-10.787 10.788 0 5.386 3.949 9.848 9.102 10.649v-7.534H8.931v-3.115h2.597V9.496c0-2.564 1.526-3.979 3.858-3.979 1.118 0 2.285.2 2.285.2v2.513h-1.285c-1.267 0-1.665.785-1.665 1.594v1.914h2.832l-.452 3.115h-2.38v7.534C20.05 21.92 24 17.459 24 12.073z" />
                </svg>
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAuthPopup(true);
                  }}
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Sign up
                </a>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-gray-500 text-xs">
              <p>
                {new Date().getFullYear()} Masai School. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auth Popup Modal */}
      {showAuthPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setShowAuthPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
            </div>
            
            <div className="text-sm text-gray-600 space-y-4 mb-6">
              <p>This attendance portal is designed with enhanced security measures. New user registration is currently disabled.</p>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="font-medium text-blue-800 mb-2">To gain access:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Contact your system administrator for login credentials</li>
                  <li>Existing users can log in with their assigned username and password</li>
                </ul>
              </div>
              
              <p className="text-sm text-center mt-4">
                For technical support or credential requests, please reach out to your Administration
              </p>
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowAuthPopup(false)}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Popup */}
      <ForgotPasswordPopup 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default Login;
