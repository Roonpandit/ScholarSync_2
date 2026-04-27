import { useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTE_CONSTANTS } from "@/constants/routeConstants";
import {
  UserCheck,
  Camera,
  Clock,
  BarChart3,
  FileText,
  Shield,
  ChevronRight,
  CheckCircle,
  X,
  ZoomIn,
  Menu,
  AlertTriangle,
  Mail,
  Phone,
  User,
} from "lucide-react";

interface SelectedImageData {
  src: string;
  alt: string;
}

interface Step {
  id: number;
  title: string;
  description: string;
  details: string[];
  image: string;
}

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

const StudentsGuide: FC = () => {
  const [selectedImage, setSelectedImage] = useState<SelectedImageData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const studentSteps = [
    {
      id: 1,
      title: "Student Dashboard Overview",
      description:
        "Access your personalized student portal with comprehensive attendance tracking, academic progress monitoring, and quick action tools.",
      details: [
        "Login using the credentials sent to your email when your account was created by the school administrator",
        "View your personalized dashboard showing real-time attendance statistics and academic standing",
        "Monitor your attendance rate percentage with visual indicators: Green (good), Yellow (attention needed), Red (critical)",
        "Check total present and absent counts with detailed breakdowns by subject and time period",
        "Access quick action buttons for immediate tasks: 'Mark Attendance' and 'Apply for Leave'",
        "View active and upcoming attendance slots with countdown timers and status indicators",
        "Check recent attendance activities and important notifications from teachers and administration",
        "Access your profile section with personal information and account management options",
      ],
      image: "photo_14.png",
    },
    {
      id: 2,
      title: "Marking Attendance with Photo & Face Detection",
      description:
        "Advanced photo verification with real-time face detection to ensure authentic attendance marking from institute premises.",
      details: [
        "Navigate to 'Mark Attendance' section from the main dashboard or quick action panel",
        "Select the appropriate attendance slot from the list of active sessions available for your enrolled classes",
        "Grant camera permission when asked by your browser",
        "Position your face in front of camera - system will detect your face automatically",
        "Wait for green checkmark confirmation that your face is properly detected",
        "Take a clear selfie when capture button becomes enabled",
        "Review your selfie and confirm location data before submission",
        "Receive immediate confirmation of successful attendance marking with timestamp",
        "Note: You can only login and mark attendance from institute premises (if IP restrictions are enabled)",
        "Important: Each attendance slot has a specific time window - late submissions may not be accepted",
      ],
      image: "photo_15.png",
    },
    {
      id: 3,
      title: "Attendance History & Records Management",
      description:
        "Track and review your complete attendance history with detailed records, photo verification logs, and performance analytics.",
      details: [
        "Access 'Attendance History' tab from the main navigation menu to view all your attendance records",
        "Browse your complete attendance timeline with detailed information for each marked session",
        "View attendance photos you submitted along with timestamps and location data for verification purposes",
        "Filter your attendance history by date range, subject, teacher, or attendance status for easy searching",
        "Check specific details for each attendance session including slot duration, marking time, and verification status",
        "Download individual attendance certificates or comprehensive attendance reports for official purposes",
        "Review teacher comments or feedback related to your attendance performance",
        "Track your attendance trends with visual graphs showing weekly, monthly, and semester patterns",
        "Identify patterns in your attendance behavior to maintain consistent academic engagement",
        "Export attendance data for scholarship applications or academic record requirements",
      ],
      image: "photo_16.png",
    },
    {
      id: 4,
      title: "Absent Attendance Tracking & Analysis",
      description:
        "Monitor and analyze your absent records with detailed insights to improve attendance patterns and academic performance.",
      details: [
        "Navigate to 'Absent Attendance' tab to view comprehensive records of all missed classes and sessions",
        "Review detailed information for each absence including date, subject, teacher, and duration of missed class",
        "Check which specific attendance slots you missed with reasons and impact on your overall attendance rate",
        "Filter absent records by date range, subject, or teacher to identify patterns in your attendance behavior",
        "View pending attendance requirements for make-up sessions or alternative attendance opportunities",
        "Analyze absence patterns to understand trends: Are you missing specific subjects more often?",
        "Track the impact of absences on your academic standing with visual indicators and warnings",
        "Receive automated alerts when your absence count approaches critical levels for any subject",
        "Access recommendations for improving attendance based on your specific absence patterns",
        "Generate absence reports for academic counseling sessions or parent meetings",
      ],
      image: "photo_17.png",
    },
    {
      id: 5,
      title: "Leave Application System",
      description:
        "Apply for various types of academic leave with proper documentation, automated email processing, and approval tracking.",
      details: [
        "Access the 'Leave Application' section from your dashboard or main navigation menu",
        "Choose from predefined leave categories: Sick Leave, Personal Leave, Family Emergency, Medical Leave, or Other Leave",
        "Select specific leave dates using the calendar interface - choose single day or date range for extended leave",
        "Specify the exact duration and mention morning/afternoon sessions if applying for partial day leave",
        "Write a comprehensive leave description explaining the reason and necessity for your absence",
        "Upload supporting documents such as medical certificates, family letters, or official documentation",
        "Read all leave policy instructions and requirements carefully before submitting your application",
        "Review the auto-generated email with pre-written subject line and formatted leave request body",
        "The system creates a professional leave application email with all your details and attachments",
        "Send the automated email to appropriate authorities (teachers, coordinators, administration) with one click",
        "Track your leave application status and receive email confirmations when processed",
        "Maintain a record of all submitted leave applications for future reference and academic records",
      ],
      image: "photo_18.png",
    },
    {
      id: 6,
      title: "Profile Management & Security",
      description:
        "Manage your personal information, account security settings, and communication preferences with enhanced privacy controls.",
      details: [
        "Access your profile section from the dashboard to view and manage all personal information",
        "Update contact details including phone number, email address, and emergency contact information",
        "Change your account password securely using the built-in password management system",
        "Ensure your password meets security requirements: minimum 8 characters with letters, numbers, and symbols",
        "Update your profile photo for better identification and verification purposes",
        "Review your academic information including enrollment details, class assignments, and subject registrations",
        "Check and update communication preferences for receiving notifications and alerts",
        "Review your account activity log showing recent logins and system access for security monitoring",
        "Manage privacy settings controlling what information is visible to teachers and fellow students",
        "Set notification preferences for attendance reminders, leave approvals, and system announcements",
        "Access account recovery options and set up security questions for account protection",
        "Download your complete academic profile and attendance record for external applications or transfers",
      ],
      image: "photo_19.png",
    },
    {
      id: 7,
      title: "Communication & Notifications",
      description:
        "Stay connected with your academic community through integrated messaging, alerts, and important announcements.",
      details: [
        "Receive instant notifications when attendance slots become active for your enrolled classes",
        "Get email alerts for upcoming attendance sessions with countdown timers and preparation reminders",
        "Receive automatic confirmations when your attendance is successfully marked and verified",
        "Get notifications about leave application status updates and approval confirmations",
        "Access important announcements from teachers, administration, and academic departments",
        "Receive warnings when your attendance rate drops below acceptable levels for any subject",
        "Get reminders about pending assignments, exams, or academic deadlines related to attendance requirements",
        "Access emergency notifications and urgent communications from school administration",
        "Receive feedback and comments from teachers regarding your attendance patterns and academic performance",
        "Stay updated about system maintenance, new features, and platform improvements",
      ],
      image: "photo_14.png",
    },
  ];

  // Image Modal Component
  const ImageModal = () => {
    if (!selectedImage) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-2 sm:p-4"
        onClick={() => setSelectedImage(null)}
      >
        <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
          <div
            className="relative bg-white rounded-lg shadow-2xl max-w-full max-h-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-[70vh] sm:max-h-[80vh] object-contain"
            />
            <div className="text-center p-2 sm:p-4 bg-white border-t border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {selectedImage.alt}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Click outside the image to close
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Image component with fallback and click handler
  const ImageWithFallback: FC<ImageWithFallbackProps> = ({ src, alt, className }) => {
    const [imageError, setImageError] = useState<boolean>(false);
    const [imageLoading, setImageLoading] = useState<boolean>(true);

    const handleImageLoad = () => {
      setImageLoading(false);
    };

    const handleImageError = () => {
      setImageError(true);
      setImageLoading(false);
    };

    const handleImageClick = () => {
      if (!imageError) {
        setSelectedImage({ src, alt });
      }
    };

    if (imageError) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center min-h-[200px]">
          <div className="text-center p-4">
            <Camera className="h-8 sm:h-12 w-8 sm:w-12 text-indigo-600 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-indigo-600 font-medium break-all">
              [{src.split("/").pop()}]
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Screenshot not available
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full group min-h-[200px]">
        <img
          src={src}
          alt={alt}
          className={`${className} cursor-pointer`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={handleImageClick}
          style={{ display: imageLoading ? "none" : "block" }}
        />
        <div
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
          onClick={handleImageClick}
        >
          <div className="transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <ZoomIn className="h-4 w-4 sm:h-6 sm:w-6 text-gray-800" />
          </div>
        </div>
        {imageLoading && (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    );
  };

  const renderSteps = (steps: Step[]) => {
    return (
      <div className="space-y-12 md:space-y-16">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-32 w-1 h-16 bg-indigo-200"></div>
            )}

            <div
              className={`md:grid md:grid-cols-2 md:gap-8 md:items-center ${
                index % 2 === 0 ? "" : "md:flex-row-reverse"
              }`}
            >
              <div
                className={`${
                  index % 2 === 0
                    ? "md:text-right md:pr-8"
                    : "md:order-last md:text-left md:pl-8"
                }`}
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white mb-4">
                  <span className="text-lg font-bold">{step.id}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 mb-4 text-lg">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5 mr-2" />
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className={`mt-6 md:mt-0 ${
                  index % 2 === 0 ? "md:pl-8" : "md:pr-8"
                }`}
              >
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={
                        step.image.startsWith("/")
                          ? step.image
                          : `/docs/${step.image}`
                      }
                      alt={step.title}
                      className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800">
      <ImageModal />

      {/* Header */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <div className="flex items-center justify-center space-x-1.5 cursor-pointer">
                <div className="h-6 w-6 sm:h-8 sm:w-8 transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="h-full w-full object-contain"
                    style={{
                      filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
                    }}
                  />
                </div>
                <h1
                  className="text-xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-blue-500 to-indigo-900 text-transparent bg-clip-text"
                  style={{ fontFamily: "Times New Roman, Times, serif" }}
                >
                  ScholarSync
                </h1>
              </div>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-1 sm:mx-2" />
              <h2 className="text-sm sm:text-xl font-semibold text-gray-700">
                Student Guide
              </h2>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mt-16 sm:mt-20">
          {/* Welcome Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 mb-8">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-indigo-100 rounded-full mb-4">
                <UserCheck className="h-8 w-8 text-indigo-600" />
              </div>
              <h1
                className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "Times New Roman, Times, serif" }}
              >
                Welcome to ScholarSync Student Portal
              </h1>
              <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Your comprehensive guide to managing attendance, tracking
                academic progress, and staying connected with your educational
                journey
              </p>
            </div>

            {/* Portal Access Information */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 sm:p-6 mb-6">
              <div className="flex items-start">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 flex-shrink-0 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-indigo-800 mb-2">
                    Student Portal Access
                  </h3>
                  <div className="text-sm sm:text-base text-indigo-700 leading-relaxed space-y-2">
                    <p>
                      <strong>Portal URL:</strong>{" "}
                      <a
                        href="https://scholarsync.online"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-800 font-semibold hover:underline"
                      >
                        https://scholarsync.online
                      </a>
                    </p>
                    <p>
                      <strong>Login Credentials:</strong> You received your
                      login credentials via email when your account was created
                      by the school administrator. Please check your inbox for
                      the welcome email containing your student ID and password.
                    </p>
                    <p>
                      <strong>Login Restrictions:</strong> You can only login
                      from institute premises (if IP restrictions are enabled by admin).
                      Teachers and admins can login from anywhere. If no IP addresses
                      are configured, you can login from any location.
                    </p>
                    <p>
                      <strong>Account Issues:</strong> If you cannot find your
                      credentials or need help accessing your account, use the
                      "Forgot Password" option or contact your
                      teacher/administrator immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Student Guidelines */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 flex-shrink-0 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-amber-800 mb-2">
                    Important Guidelines
                  </h3>
                  <div className="text-sm sm:text-base text-amber-700 leading-relaxed space-y-2">
                    <p>
                      <strong>Account Security:</strong> Students cannot create
                      accounts independently. All student accounts are created
                      by administrators to ensure proper enrollment and
                      security.
                    </p>
                    <p>
                      <strong>Photo Verification:</strong> You must take a clear
                      selfie for each attendance marking. Make sure your face is
                      clearly visible and you're in good lighting.
                    </p>
                    <p>
                      <strong>Location Requirement:</strong> Attendance marking
                      requires you to be within the designated classroom or
                      campus area as specified by your teacher.
                    </p>
                    <p>
                      <strong>Time Windows:</strong> Each attendance slot has
                      specific timing. Late submissions may not be accepted, so
                      mark your attendance promptly when slots become active.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Benefits */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-start">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2">
                    Benefits of Regular Attendance
                  </h3>
                  <div className="text-sm sm:text-base text-green-700 leading-relaxed space-y-2">
                    <p>
                      <strong>Academic Success:</strong> Regular attendance is
                      directly linked to better academic performance and
                      understanding of subject matter.
                    </p>
                    <p>
                      <strong>Scholarship Eligibility:</strong> Many
                      scholarships and academic programs require minimum
                      attendance percentages for eligibility.
                    </p>
                    <p>
                      <strong>Progress Tracking:</strong> Use the attendance
                      analytics to identify patterns and improve your academic
                      engagement.
                    </p>
                    <p>
                      <strong>Future Opportunities:</strong> Good attendance
                      records are valuable for college applications, job
                      interviews, and character references.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4">
                Complete Student Guide
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
                Follow these detailed steps to master all features of the
                ScholarSync Student Portal
              </p>
            </div>

            {renderSteps(studentSteps)}
          </div>

          {/* Quick Tips Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 mt-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              Quick Tips for Success
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <Camera className="h-5 w-5 text-blue-600 mr-2" />
                    Photo Verification Tips
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Ensure good lighting when taking selfies</li>
                    <li>• Keep your face clearly visible and centered</li>
                    <li>• Avoid wearing sunglasses or face coverings</li>
                    <li>• Take photos in the designated location only</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <Clock className="h-5 w-5 text-green-600 mr-2" />
                    Time Management
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>
                      • Check for active slots regularly throughout the day
                    </li>
                    <li>• Mark attendance as soon as slots become active</li>
                    <li>• Set phone reminders for important classes</li>
                    <li>
                      • Don't wait until the last minute to mark attendance
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <FileText className="h-5 w-5 text-purple-600 mr-2" />
                    Leave Applications
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Apply for leave in advance whenever possible</li>
                    <li>• Provide proper documentation for medical leave</li>
                    <li>• Be specific and honest in your leave descriptions</li>
                    <li>• Follow up on leave applications if needed</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <User className="h-5 w-5 text-orange-600 mr-2" />
                    Account Management
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Keep your profile information updated</li>
                    <li>• Use a strong, secure password</li>
                    <li>• Never share your login credentials</li>
                    <li>• Log out from shared devices after use</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting Section */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-8 mt-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              Common Issues & Solutions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Camera Not Working
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• Allow camera permissions in your browser</p>
                    <p>• Check if another app is using the camera</p>
                    <p>• Try refreshing the page and try again</p>
                    <p>• Switch to a different browser if issues persist</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Location Issues
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• Enable location services on your device</p>
                    <p>• Make sure you're within the required area</p>
                    <p>• Check if GPS is working properly</p>
                    <p>
                      • Contact teacher if location requirements are unclear
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Attendance Not Marked
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• Check if the attendance slot is still active</p>
                    <p>• Verify your internet connection</p>
                    <p>• Ensure photo quality meets requirements</p>
                    <p>• Contact teacher immediately if slot expired</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Login Problems
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• Double-check your credentials for typos</p>
                    <p>• Use "Forgot Password" if you can't remember</p>
                    <p>• Clear browser cache and cookies</p>
                    <p>• Contact administrator for account recovery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-gray-900 rounded-xl text-white p-4 sm:p-8 mt-8">
            <div className="text-center mb-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-4">Need Help?</h3>
              <p className="text-gray-300 mb-6">
                Our support team and your teachers are here to help you succeed
                with ScholarSync.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <Mail className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h4 className="text-lg font-semibold mb-2">Email Support</h4>
                <a
                  href="mailto:tarunvashisth0000@gmail.com"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  tarunvashisth0000@gmail.com
                </a>
                <p className="text-gray-400 text-sm mt-1">
                  Response within 24 hours
                </p>
              </div>
              <div className="text-center">
                <Phone className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h4 className="text-lg font-semibold mb-2">Phone Support</h4>
                <a
                  href="tel:+917082889441"
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  +91 7082889441
                </a>
                <p className="text-gray-400 text-sm mt-1">
                  Mon-Fri, 9 AM - 6 PM
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                For immediate assistance with attendance issues, contact your
                class teacher or academic coordinator.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-2">
            <div>
              <div
                className="flex items-center justify-center space-x-1.5 cursor-pointer"
                onClick={() => navigate(ROUTE_CONSTANTS.HOME)}
              >
                <div className="h-6 w-6 sm:h-8 sm:w-8 transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="h-full w-full object-contain"
                    style={{
                      filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
                    }}
                  />
                </div>
                <h1
                  className="text-xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-blue-100 to-indigo-900 text-transparent bg-clip-text"
                  style={{ fontFamily: "Times New Roman, Times, serif" }}
                >
                  ScholarSync
                </h1>
              </div>
              <p className="text-gray-400 text-center text-sm sm:text-base">
                Smart attendance management for modern educational institutions.
              </p>

              {/* Contact Links */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-4 mt-3">
                <a
                  href="mailto:tarunvashisth0000@gmail.com"
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-xs sm:text-sm flex items-center space-x-1"
                >
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="break-all">tarunvashisth0000@gmail.com</span>
                </a>
                <a
                  href="tel:+917082889441"
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-xs sm:text-sm flex items-center space-x-1"
                >
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>+917082889441</span>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-1 pb-1 mt-6 text-center text-gray-400">
            <p className="text-xs sm:text-sm">
              &copy; {new Date().getFullYear()} ScholarSync. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentsGuide;
