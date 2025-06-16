import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
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
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 text-transparent bg-clip-text mb-2">
              Masai Attendance
            </h1>
            <p className="text-gray-600">
              Welcome back! Sign in to your account
            </p>
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
              <div className="flex justify-between items-center mt-1">
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
                <a
                  href="#"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Forgot Password?
                </a>
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
              <button className="flex items-center justify-center p-2 border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors">
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
              <button className="flex items-center justify-center p-2 border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors">
                <svg
                  className="h-5 w-5 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M24 12.073c0-5.962-4.825-10.788-10.787-10.788-5.962 0-10.787 4.826-10.787 10.788 0 5.386 3.949 9.848 9.102 10.649v-7.534H8.931v-3.115h2.597V9.496c0-2.564 1.526-3.979 3.858-3.979 1.118 0 2.285.2 2.285.2v2.513h-1.285c-1.267 0-1.665.785-1.665 1.594v1.914h2.832l-.452 3.115h-2.38v7.534C20.05 21.92 24 17.459 24 12.073z" />
                </svg>
              </button>
              <button className="flex items-center justify-center p-2 border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.3362 6.00939C17.0148 4.65685 15.1606 3.90784 13.1964 3.90784H10.8036C8.83936 3.90784 6.98518 4.65685 5.66384 6.00939C4.34249 7.36192 3.6095 9.25668 3.6095 11.266V13.7333C3.6095 15.7426 4.34249 17.6374 5.66384 18.9899C6.98518 20.3424 8.83936 21.0915 10.8036 21.0915H13.1964C15.1606 21.0915 17.0148 20.3424 18.3362 18.9899C19.6575 17.6374 20.3905 15.7426 20.3905 13.7333V11.266C20.3905 9.25668 19.6575 7.36192 18.3362 6.00939ZM14.9458 11.9631L10.5779 15.257C10.4808 15.331 10.3585 15.3704 10.2308 15.3704C10.1031 15.3704 9.9807 15.331 9.8838 15.257C9.7892 15.185 9.71498 15.084 9.67101 14.9667C9.62704 14.8494 9.6148 14.7209 9.6355 14.5975V7.99908C9.6148 7.87564 9.62704 7.7471 9.67101 7.62985C9.71498 7.5126 9.7892 7.41147 9.8838 7.33969C9.97937 7.26666 10.0946 7.22595 10.2139 7.22274C10.3333 7.21954 10.4505 7.25402 10.5496 7.32207C10.6487 7.39011 10.7259 7.48836 10.7712 7.60449C10.8164 7.72062 10.8277 7.84889 10.8036 7.97235V13.6358L14.1924 11.0631C14.2896 10.988 14.4122 10.9478 14.5401 10.9478C14.668 10.9478 14.7906 10.988 14.8877 11.0631C14.9821 11.1344 15.0563 11.2348 15.1004 11.352C15.1446 11.4692 15.1571 11.5977 15.1365 11.7212C15.1159 11.8447 15.0676 11.9581 14.9971 12.0486C14.9266 12.1392 14.8371 12.2031 14.7375 12.2326L14.9458 11.9631Z" />
                </svg>
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Sign up
                </a>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-gray-500 text-xs">
              <p>
                © {new Date().getFullYear()} Masai School. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
