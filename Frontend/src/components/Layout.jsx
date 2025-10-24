import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaFileAlt } from 'react-icons/fa';
import { useAuth } from "../contexts/AuthContext.jsx";
import Profile from "./Profile";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Handle window scroll for header shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      if (
        sidebarOpen &&
        !event.target.closest(".sidebar") &&
        !event.target.closest(".toggle-sidebar")
      ) {
        setSidebarOpen(false);
      }
      if (dropdownOpen && !event.target.closest(".user-dropdown")) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen, dropdownOpen]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/home");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header
        className={`bg-white fixed w-full top-0 z-50 transition-all duration-200 ${scrolled ? "shadow-md" : "shadow-sm"
          }`}
      >
        <div className="w-full px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="toggle-sidebar md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? (
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
            <div className="flex items-center justify-center space-x-1.5">
              <div className="h-8 w-8 transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-full w-full object-contain"
                  style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                />
              </div>
              <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-blue-500 to-indigo-900 text-transparent bg-clip-text" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                ScholarSync
              </h1>
            </div>
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
            {/* Notifications Icon */}
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Dropdown */}
            <div className="relative user-dropdown">
              <button
                onClick={toggleDropdown}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "User"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student"}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? "transform rotate-180" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden z-10 border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside
          className={`
            sidebar w-72 bg-white fixed top-16 bottom-0 left-0 z-40
            transform transition-transform duration-300 ease-in-out
            md:translate-x-0 md:shadow-none md:border-r md:border-gray-200
            ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 md:hidden flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || "User"}
                </span>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                  <span className="text-xs text-gray-500">
                    {user?.role || "Student"}
                  </span>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 pt-2">
              {user?.role === "admin" ? (
                <div className="space-y-1">
                  <div className="mb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin Dashboard
                  </div>
                  <NavItem
                    to="/admin"
                    isActive={isActive("/admin")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    }
                  >
                    Dashboard
                  </NavItem>
                  <NavItem
                    to="/admin/students"
                    isActive={isActive("/admin/students")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    }
                  >
                    Students
                  </NavItem>
                  <NavItem
                    to="/admin/teachers"
                    isActive={isActive("/admin/teachers")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    }
                  >
                    Teachers
                  </NavItem>
                  <NavItem
                    to="/admin/review"
                    isActive={isActive("/admin/review")}
                    icon={<FaFileAlt className="h-5 w-5" />}
                  >
                    Feedback Form
                  </NavItem>

                  <div className="my-3 px-3 pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-200">
                    Attendance Management
                  </div>
                  <NavItem
                    to="/admin/attendance-slots"
                    isActive={isActive("/admin/attendance-slots")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    }
                  >
                    Attendance Slots
                  </NavItem>
                  <NavItem
                    to="/admin/attendance/stats"
                    isActive={isActive("/admin/attendance/stats")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    }
                  >
                    Attendance Management
                  </NavItem>

                  <div className="my-3 px-3 pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-200">
                    Security
                  </div>
                  <NavItem
                    to="/admin/ip-management"
                    isActive={isActive("/admin/ip-management")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    }
                  >
                    IP Management
                  </NavItem>

                  <div className="my-3 px-3 pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-200">
                    Organization
                  </div>
                  <NavItem
                    to="/admin/batch-management"
                    isActive={isActive("/admin/batch-management")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    }
                  >
                    Batch Management
                  </NavItem>
                </div>
              ) : user?.role === "teacher" ? (
                <div className="space-y-1">
                  <div className="mb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Teacher Dashboard
                  </div>
                  <NavItem
                    to="/teacher"
                    isActive={isActive("/teacher")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    }
                  >
                    Dashboard
                  </NavItem>
                  <NavItem
                    to="/teacher/students"
                    isActive={isActive("/teacher/students")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    }
                  >
                    Students
                  </NavItem>
                  <NavItem
                    to="/teacher/review"
                    isActive={isActive("/teacher/review")}
                    icon={<FaFileAlt className="h-5 w-5" />}
                  >
                    Feedback Form
                  </NavItem>

                  <div className="my-3 px-3 pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-200">
                    Attendance Management
                  </div>
                  <NavItem
                    to="/teacher/attendance-slots"
                    isActive={isActive("/teacher/attendance-slots")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    }
                  >
                    Attendance Slots
                  </NavItem>
                  <NavItem
                    to="/teacher/attendance/stats"
                    isActive={isActive("/teacher/attendance/stats")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    }
                  >
                    Attendance Management
                  </NavItem>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="mb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student Dashboard
                  </div>
                  <NavItem
                    to="/student"
                    isActive={isActive("/student")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    }
                  >
                    Dashboard
                  </NavItem>

                  <div className="my-3 px-3 pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-200">
                    Attendance
                  </div>
                  <NavItem
                    to="/student/mark-attendance"
                    isActive={isActive("/student/mark-attendance")}
                    badge={true}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
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
                    }
                  >
                    Mark Attendance
                  </NavItem>
                  <NavItem
                    to="/student/attendance-history"
                    isActive={isActive("/student/attendance-history")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    }
                  >
                    Attendance History
                  </NavItem>
                  <NavItem
                    to="/student/absence-history"
                    isActive={isActive("/student/absence-history")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                  >
                    Absence History
                  </NavItem>
                  <NavItem
                    to="/student/apply-leave"
                    isActive={isActive("/student/apply-leave")}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M17.414 2.586A2 2 0 0016 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-.586-1.414zM6 4h8v2H6V4zm0 4h5v2H6V8zm0 4h8v2H6v-2zm9 4h-1v1h1v-1z" />
                      </svg>
                    }
                  >
                    Apply Leave
                  </NavItem>
                </div>
              )}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Need help?
                    </p>
                    <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                      Contact support
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 pt-6 px-4 pb-8 md:ml-72`}
        >
          <div className="container mx-auto max-w-screen-xl">{children}</div>
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowProfileModal(false)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => setShowProfileModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <Profile />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Navigation Item Component
const NavItem = ({ to, isActive, icon, children, badge = false }) => {
  return (
    <Link
      to={to}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-150 hover:bg-gray-100 relative group
        ${isActive ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-700"}
      `}
    >
      <div
        className={`transition-colors duration-150 ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-500"
          }`}
      >
        {icon}
      </div>
      <span>{children}</span>
      {isActive && (
        <div className="ml-auto w-1 h-5 bg-blue-600 rounded-full"></div>
      )}
      {badge && !isActive && (
        <span className="ml-auto px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          New
        </span>
      )}
    </Link>
  );
};

export default Layout;