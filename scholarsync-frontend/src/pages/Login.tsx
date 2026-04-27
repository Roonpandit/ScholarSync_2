import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-context";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ForgotPasswordPopup from "@/components/ForgotPasswordPopup";
import { ROUTE_CONSTANTS } from "@/constants/routeConstants";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Simulate initial page loading with skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login({ email, password });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-900 p-4 sm:p-6 md:p-8">
      {pageLoading ? (
        <LoginSkeleton />
      ) : (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 border border-gray-100 transition-all duration-300 hover:shadow-blue-500/20 relative">
          <Link
            to={ROUTE_CONSTANTS.HOME}
            className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-600"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end mt-1">
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
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                <>
                  Sign In
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-gray-500 text-xs">
              <p>
                {new Date().getFullYear()} ScholarSync. All rights reserved.
              </p>
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
