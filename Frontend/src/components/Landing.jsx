import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Clock,
  Bell,
  BarChart3,
  FileText,
  Download,
  Check,
  Menu,
  X,
  Camera,
  UserCheck,
  Calendar,
  Shield,
  Smartphone,
  Mail,
} from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    role: "School Principal",
    comment:
      "ScholarSync has revolutionized our attendance tracking. The photo verification feature has eliminated proxy attendance completely!",
    avatar: "/api/placeholder/40/40",
  },
  {
    id: 2,
    name: "David Chen",
    role: "Class Teacher",
    comment:
      "As a teacher, ScholarSync gives me real-time insights into student attendance patterns. The analytics are incredibly helpful for parent meetings.",
    avatar: "/api/placeholder/40/40",
  },
  {
    id: 3,
    name: "Maria Rodriguez",
    role: "Student",
    comment:
      "I love how easy it is to mark my attendance and track my percentage. The mobile app works perfectly!",
    avatar: "/api/placeholder/40/40",
  },
];

const features = [
  {
    id: 1,
    title: "Photo-Based Attendance",
    description:
      "Mark attendance with facial recognition technology to eliminate proxy attendance and ensure accuracy.",
    icon: Camera,
  },
  {
    id: 2,
    title: "Real-Time Tracking",
    description:
      "Track attendance in real-time with instant updates and live monitoring for administrators.",
    icon: UserCheck,
  },
  {
    id: 3,
    title: "Smart Notifications",
    description:
      "Automated alerts for attendance slots, low attendance warnings, and system announcements.",
    icon: Bell,
  },
  {
    id: 4,
    title: "Advanced Analytics",
    description: "Comprehensive reports, attendance trends, and detailed insights for data-driven decisions.",
    icon: BarChart3,
  },
  {
    id: 5,
    title: "Bulk Import System",
    description: "Import students in bulk via CSV/Excel files for quick setup and management.",
    icon: FileText,
  },
  {
    id: 6,
    title: "Mobile Responsive",
    description: "Access from any device with our fully responsive design and mobile-optimized interface.",
    icon: Smartphone,
  },
];

const faqItems = [
  {
    question: "How does the photo-based attendance work?",
    answer:
      "Students take a photo when marking attendance, which is verified using facial recognition technology to prevent proxy attendance and ensure accuracy.",
  },
  {
    question: "Can I import multiple students at once?",
    answer:
      "Yes! You can bulk import students using CSV or Excel files. Our system processes the data and creates accounts automatically.",
  },
  {
    question: "What happens if a student forgets to mark attendance?",
    answer:
      "Administrators can manually mark attendance for students and add notes explaining the circumstances.",
  },
  {
    question: "How do attendance notifications work?",
    answer:
      "The system sends automated email notifications for attendance slots, low attendance alerts, and important announcements to keep everyone informed.",
  },
  {
    question: "Can I generate attendance reports?",
    answer:
      "Absolutely! Generate comprehensive reports with attendance statistics, trends, class-wise analysis, and exportable data for compliance purposes.",
  },
];

export default function ScholarSyncLanding() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);
  const featureCardsRef = useRef([]);

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const setFeatureCardRef = (el, index) => {
    featureCardsRef.current[index] = el;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800">
      <nav className="bg-white shadow-md">
        <div className="fixed top-0 left-0 w-full z-50 bg-white mx-auto px-4 sm:px-6 lg:px-8 shadow-md">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
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
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <a
                  href="#features"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  How It Works
                </a>
                <a
                  href="#testimonials"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  Testimonials
                </a>
                <a
                  href="#faq"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  FAQ
                </a>
              </div>
            </div>
            <div className="hidden md:flex items-center">
              <button
                onClick={() => navigate("/login")}
                className="ml-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Get Started
              </button>
            </div>
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 focus:outline-none"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          >
            <div
              className="fixed right-0 top-0 h-full bg-white shadow-2xl p-6 space-y-8 transform transition-transform duration-300 ease-in-out animate-slide-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-3 text-lg">
                {[
                  { href: "#features", label: "Features" },
                  { href: "#how-it-works", label: "How It Works" },
                  { href: "#testimonials", label: "Testimonials" },
                  { href: "#faq", label: "FAQ" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block py-2 px-2 rounded-lg transition-colors duration-200 hover:bg-indigo-50 hover:text-indigo-600 text-gray-800 font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="border-t border-gray-300 pt-5 space-y-4">
                <button
                  onClick={() => {
                    navigate("/login");
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-center py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="relative bg-white overflow-hidden" ref={heroRef}>
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl font-['Times_New_Roman']">
                  <span className="block xl:inline text-7xl">
                    Smart Attendance
                  </span>{" "}
                  <span className="block text-indigo-600 xl:inline text-5xl">
                    Management System
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Revolutionize attendance tracking with ScholarSync. Photo-verified attendance, real-time analytics, and comprehensive management tools for modern educational institutions.
                </p>
                <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3">
                  <button
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-base md:text-lg font-semibold shadow-md hover:bg-indigo-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Get Started
                  </button>

                  <button
                    onClick={() =>
                      document
                        .getElementById("features")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-base md:text-lg font-semibold shadow-sm hover:bg-indigo-100 transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg"
            alt="Students using modern technology for attendance"
          />
        </div>
      </div>

      <div id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={featuresRef}>
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-4xl leading-[1.35] font-extrabold tracking-tight text-gray-900 sm:text-3xl lg:mx-auto font-['Times_New_Roman']">
              Everything You Need for Smart Attendance Management
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              ScholarSync provides comprehensive tools for photo-verified attendance, real-time tracking, and powerful analytics for educational institutions.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={feature.id}
                  ref={(el) => setFeatureCardRef(el, index)}
                  className="rounded-[10px] p-6 shadow-md transition-transform transform hover:scale-105 duration-300"
                >
                  <div className="flex items-center justify-center h-12 w-12 text-indigo-600 mb-4 transition-transform transform hover:scale-110 duration-300">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="py-12" ref={statsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-indigo-700 rounded-[10px] p-6">
              <div className="text-4xl font-bold text-white">50,000+</div>
              <div className="mt-2 text-lg text-indigo-100">Active Students</div>
            </div>
            <div className="bg-indigo-700 rounded-[10px] p-6">
              <div className="text-4xl font-bold text-white">1,000+</div>
              <div className="mt-2 text-lg text-indigo-100">Schools Using</div>
            </div>
            <div className="bg-indigo-700 rounded-[10px] p-6">
              <div className="text-4xl font-bold text-white">99.5%</div>
              <div className="mt-2 text-lg text-indigo-100">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
              Process
            </h2>
            <p className="mt-2 text-4xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-4xl font-['Times_New_Roman']">
              How ScholarSync Works
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              A simple and secure process for photo-verified attendance tracking
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-indigo-200"></div>

            <div className="space-y-12 md:space-y-0">
              <div className="md:grid md:grid-cols-2 md:gap-8 md:items-center mb-12">
                <div className="md:text-right md:pr-8">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white mb-4">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Setup & Registration
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Register your institution and import students via bulk CSV upload or individual registration. Setup is complete in minutes.
                  </p>
                </div>
                <div className="mt-4 md:mt-0 md:pl-8">
                  <div className="bg-white p-6 rounded-[10px] shadow-md">
                    <img
                      src="https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg"
                      alt="Setup dashboard"
                      className="rounded-[10px] transition-transform transform hover:scale-105 duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="md:grid md:grid-cols-2 md:gap-8 md:items-center mb-12">
                <div className="md:order-last md:text-left md:pl-8">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white mb-4">
                    <span className="text-lg font-bold">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Create Attendance Slots
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Teachers create attendance slots for their classes. Students receive notifications when attendance tracking begins.
                  </p>
                </div>
                <div className="mt-4 md:mt-0 md:pr-8">
                  <div className="bg-white p-6 rounded-[10px] shadow-md">
                    <img
                      src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg"
                      alt="Creating attendance slots"
                      className="rounded-[10px] transition-transform transform hover:scale-105 duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="md:grid md:grid-cols-2 md:gap-8 md:items-center mb-12">
                <div className="md:text-right md:pr-8">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white mb-4">
                    <span className="text-lg font-bold">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Photo-Verified Attendance
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Students mark attendance by taking a photo. Facial recognition technology verifies identity and prevents proxy attendance.
                  </p>
                </div>
                <div className="mt-4 md:mt-0 md:pl-8">
                  <div className="bg-white p-6 rounded-[10px] shadow-md">
                    <img
                      src="https://images.pexels.com/photos/4145153/pexels-photo-4145153.jpeg"
                      alt="Photo verification"
                      className="rounded-[10px] transition-transform transform hover:scale-105 duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="md:grid md:grid-cols-2 md:gap-8 md:items-center">
                <div className="md:order-last md:text-left md:pl-8">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white mb-4">
                    <span className="text-lg font-bold">4</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Analytics & Reports
                  </h3>
                  <p className="mt-2 text-gray-600">
                    View real-time attendance analytics, generate reports, and get insights on attendance patterns for better decision making.
                  </p>
                </div>
                <div className="mt-4 md:mt-0 md:pr-8">
                  <div className="bg-white p-6 rounded-[10px] shadow-md">
                    <img
                      src="https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg"
                      alt="Analytics dashboard"
                      className="rounded-[10px] transition-transform transform hover:scale-105 duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="testimonials" className="py-16 bg-white" ref={testimonialsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
              Testimonials
            </h2>
            <p className="mt-2 text-4xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-['Times_New_Roman']">
              What Our Users Say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-gray-50 p-6 rounded-[10px] shadow-md transition-transform transform hover:scale-105 hover:bg-gray-100 duration-300"
              >
                <div className="flex items-center mb-4">
                  <img
                    className="h-10 w-10 rounded-full"
                    src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg"
                    alt={testimonial.name}
                  />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-base text-indigo-400 font-semibold tracking-wide uppercase">
              For Administrators
            </h2>
            <p className="mt-2 text-5xl leading-[1] font-extrabold sm:text-4xl font-['Times_New_Roman']">
              Comprehensive Management Tools
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-300 mx-auto">
              ScholarSync provides powerful tools for educational administrators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-700 p-6 rounded-[10px]">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2 text-indigo-400" />
                Student Management
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Bulk import students via CSV/Excel files</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Manage student profiles and class assignments</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>View detailed student attendance histories</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-700 p-6 rounded-[10px]">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Clock className="h-6 w-6 mr-2 text-indigo-400" />
                Attendance Management
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Create and manage attendance slots</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Real-time attendance monitoring</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Manual attendance override capabilities</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-700 p-6 rounded-[10px]">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <BarChart3 className="h-6 w-6 mr-2 text-indigo-400" />
                Analytics & Reports
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Comprehensive attendance analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Generate detailed attendance reports</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Export data for compliance and analysis</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-700 p-6 rounded-[10px]">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Bell className="h-6 w-6 mr-2 text-indigo-400" />
                Notification System
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Automated email notifications</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>Low attendance alerts</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>System announcements and updates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div id="faq" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
              FAQ
            </h2>
            <p className="mt-2 text-5xl leading-[1] font-extrabold tracking-tight text-gray-900 sm:text-4xl font-['Times_New_Roman']">
              Frequently Asked Questions
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Find answers to the most common questions about ScholarSync
            </p>
          </div>

          <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200">
            {faqItems.map((item, index) => (
              <div key={index} className="py-6">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-start justify-between text-left focus:outline-none"
                >
                  <span className="text-lg font-medium text-gray-900">
                    {item.question}
                  </span>
                  <span className="ml-6 flex-shrink-0">
                    {openFAQ === index ? (
                      <svg
                        className="h-6 w-6 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-6 w-6 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </span>
                </button>
                {openFAQ === index && (
                  <div className="mt-2 pr-12">
                    <p className="text-base text-gray-600">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
              Comparison
            </h2>
            <p className="mt-2 text-5xl leading-[1] font-extrabold tracking-tight text-gray-900 sm:text-4xl font-['Times_New_Roman']">
              Why Choose ScholarSync?
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              See how ScholarSync compares to traditional attendance systems
            </p>
          </div>

          <div className="mt-12 space-y-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            <div className="flex flex-col bg-white rounded-2xl shadow-xl border border-indigo-300 transition-transform transform hover:scale-105 duration-300">
              <div className="px-6 py-8">
                <h3 className="text-xl font-medium text-gray-900 text-center" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                  Traditional Systems
                </h3>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-gray-500">Paper-based attendance</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-gray-500">Prone to proxy attendance</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-gray-500">Manual data entry</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-gray-500">Limited analytics</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-gray-500">Time-consuming processes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col bg-gradient-to-r from-blue-500 to-indigo-900 rounded-2xl shadow-xl text-white transition-transform transform hover:scale-105 duration-300">
              <div className="px-6 py-8">
                <h3 className="text-2xl font-medium text-center" style={{ fontFamily: 'Times New Roman, Times, serif' }}>ScholarSync</h3>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-indigo-50">Photo-verified attendance</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-indigo-50">Eliminates proxy attendance</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-indigo-50">Automated data processing</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-indigo-50">Advanced analytics</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-indigo-50">Real-time processing</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col bg-white rounded-2xl shadow-xl border border-indigo-300 transition-transform transform hover:scale-105 duration-300">
              <div className="px-6 py-8">
                <h3 className="text-xl font-medium text-gray-900 text-center">
                  Basic Digital Systems
                </h3>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-gray-500">Digital attendance</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-gray-500">Still allows proxy attendance</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-gray-500">Basic automation</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-gray-500">Limited reporting</p>
                  </div>
                  <div className="flex items-start">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="ml-3 text-gray-500">No photo verification</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-blue-800" ref={ctaRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
            Ready to Transform Your Attendance Management?
          </h2>
          <p className="mt-4 text-1xl text-indigo-100">
            Join thousands of institutions already using ScholarSync for accurate, efficient attendance tracking.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-4">
            <button
              onClick={() => alert("Starting free trial...")}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-indigo-600 bg-white hover:bg-gray-50 transition duration-300"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => alert("Scheduling demo...")}
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-base font-medium rounded-xl text-white hover:bg-indigo-500 transition duration-300"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center justify-center space-x-1.5">
              <div className="h-8 w-8 transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-full w-full object-contain"
                  style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                />
              </div>
              <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-blue-100 to-indigo-900 text-transparent bg-clip-text" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                ScholarSync
              </h1>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-gray-400 hover:text-white">
                    Testimonials
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-gray-400 hover:text-white">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    API Guide
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">support@scholarsync.com</li>
                <li className="text-gray-400">+1 (555) 987-6543</li>
              </ul>
            </div>
          </div>
          <div className="mt-2 pt-4 border-t border-gray-800 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} ScholarSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}