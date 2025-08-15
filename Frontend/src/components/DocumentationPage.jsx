import { useState } from "react";
import {
    BookOpen,
    Users,
    UserCheck,
    Clock,
    BarChart3,
    FileText,
    Camera,
    Shield,
    Mail,
    ChevronRight,
    Home,
    AlertTriangle,
    CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DocumentationPage = () => {
    const [activeSection, setActiveSection] = useState("overview");
    const navigate = useNavigate();
    const sections = [
        { id: "overview", label: "Overview", icon: Home },
        { id: "admin", label: "Admin Guide", icon: Shield },
        { id: "teacher", label: "Teacher Guide", icon: Users },
        { id: "student", label: "Student Guide", icon: UserCheck }
    ];

    const adminSteps = [
        {
            id: 1,
            title: "Login to Admin Dashboard",
            description: "Access the super admin dashboard with provided credentials to manage the entire attendance system.",
            details: [
                "Click 'Get Started' on homepage - redirects to login page",
                "Use provided super admin credentials or reset password if needed",
                "View dashboard with total students, teachers, active slots overview",
                "Access recent attendance records and quick panel navigation",
                "Note: Notification icon in navbar currently uses email system"
            ],
            image: "photo_3.png"
        },
        {
            id: 2,
            title: "Student Management",
            description: "Comprehensive student management with individual and bulk operations, complete with attendance analytics.",
            details: [
                "Navigate to Students tab from sidebar",
                "Search students by name or student code",
                "Add students individually (they get confirmation email with credentials)",
                "Bulk upload multiple students using CSV/Excel templates",
                "View detailed student profiles with attendance history and analytics",
                "Edit student details and view present slot details with location and photos",
                "Delete students (removes all attendance records)"
            ],
            image: "photo_students.png"
        },
        {
            id: 3,
            title: "Teacher Management",
            description: "Create and manage teacher accounts with email credential delivery and profile management.",
            details: [
                "Access Teachers tab from sidebar",
                "View list of all teachers with search functionality",
                "Create new teacher accounts with automatic credential email delivery",
                "Edit teacher profiles and permissions",
                "Delete teacher accounts when needed",
                "Teachers receive login credentials via email automatically"
            ],
            image: "photo_teachers.png"
        },
        {
            id: 4,
            title: "Feedback Form Management",
            description: "Create and distribute instant feedback forms to selected students via email system.",
            details: [
                "Navigate to Feedback Form tab",
                "Insert feedback form link when immediate student feedback needed",
                "Select specific students or groups for form distribution",
                "Students receive form links directly in their email",
                "Track form responses and completion rates"
            ],
            image: "photo_feedback.png"
        },
        {
            id: 5,
            title: "Attendance Slots Management",
            description: "Complete attendance slot lifecycle management with real-time monitoring and data export.",
            details: [
                "Access Attendance Slots tab to view all slots",
                "Filter slots by status: Upcoming, Active, Expired",
                "Filter slots by specific dates",
                "View detailed slot information including total present/absent",
                "Export slot data to Excel sheets",
                "View attendance marking time, student location codes, and photos",
                "Delete slots (removes all associated attendance records)"
            ],
            image: "photo_slots.png"
        },
        {
            id: 6,
            title: "Attendance Statistics & Analytics",
            description: "Comprehensive attendance analytics with filtering and absent student tracking.",
            details: [
                "Navigate to Attendance Stats for student present/absent statistics",
                "Filter data by absent count, month, and year",
                "Access Absent Students tab for detailed absence tracking",
                "View which slots students were absent from",
                "Generate reports for administrative and compliance purposes",
                "Track attendance trends and patterns"
            ],
            image: "photo_stats.png"
        }
    ];

    const teacherSteps = [
        {
            id: 1,
            title: "Teacher Dashboard Access",
            description: "Login with teacher credentials to access your personalized dashboard with limited admin permissions.",
            details: [
                "Use teacher credentials provided via email after admin creates your account",
                "Access teacher-specific dashboard with similar UI to admin",
                "View assigned classes, schedules, and your attendance slots",
                "Monitor attendance statistics for your classes",
                "Note: Teachers have limited permissions - cannot delete students or slots for security"
            ],
            image: "photo_teacher_dashboard.png"
        },
        {
            id: 2,
            title: "Create and Manage Attendance Slots",
            description: "Set up attendance tracking sessions for your classes with specific time windows and parameters.",
            details: [
                "Navigate to Attendance Slots section",
                "Create new attendance slots with date, time, and duration",
                "Assign slots to specific classes or student groups",
                "Set attendance window parameters and location requirements",
                "Monitor slot status: upcoming, active, or expired",
                "View but cannot delete slots (admin-only permission)"
            ],
            image: "photo_teacher_slots.png"
        },
        {
            id: 3,
            title: "Real-time Attendance Monitoring",
            description: "Track student attendance in real-time with photo verification and location data during active slots.",
            details: [
                "Monitor active attendance sessions in real-time",
                "View students checking in with timestamps",
                "Verify student attendance photos as they submit",
                "Track location data and attendance completion rates",
                "View detailed attendance analytics for each slot",
                "Export attendance data for your classes"
            ],
            image: "photo_teacher_monitor.png"
        },
        {
            id: 4,
            title: "Student Management (Limited)",
            description: "View and manage students in your classes with restricted permissions for data security.",
            details: [
                "Access Students tab to view students in your classes",
                "Search students by name or student code",
                "View student profiles and attendance history",
                "Edit student information (limited fields)",
                "Cannot delete students (security restriction)",
                "View student attendance analytics and patterns"
            ],
            image: "photo_teacher_students.png"
        },
        {
            id: 5,
            title: "Attendance Reports & Analytics",
            description: "Generate detailed attendance reports and analytics for your classes and teaching sessions.",
            details: [
                "Access Attendance Stats for your classes",
                "Generate class-wise attendance reports",
                "Filter data by date range, student, or attendance status",
                "View attendance trends and patterns",
                "Export reports to Excel for record-keeping",
                "Track student attendance percentages"
            ],
            image: "photo_teacher_reports.png"
        }
    ];

    const studentSteps = [
        {
            id: 1,
            title: "Student Dashboard Overview",
            description: "Access your personalized dashboard with attendance statistics and active session management.",
            details: [
                "Login with student credentials received via email",
                "View attendance rate, total presents, and absents",
                "Check active and upcoming slots in the listing",
                "Access quick action panel with 'Mark Attendance' and 'Apply Leave'",
                "View profile section with personal details and password update option"
            ],
            image: "photo_student_dashboard.png"
        },
        {
            id: 2,
            title: "Mark Attendance with Photo Verification",
            description: "Use the photo verification system to mark attendance for active slots with location tracking.",
            details: [
                "Navigate to 'Mark Attendance' tab",
                "Select active attendance slot from available options",
                "Take a clear selfie using device camera",
                "Review your selfie before submission",
                "Confirm location data and submit attendance",
                "Receive confirmation of successful attendance marking"
            ],
            image: "photo_student_attendance.png"
        },
        {
            id: 3,
            title: "Attendance History & Records",
            description: "Track your complete attendance history with detailed records and photo verification logs.",
            details: [
                "Access 'Attendance History' tab from navigation",
                "View your complete attendance history with present records",
                "Filter attendance by date range or status",
                "View past attendance photos and location data",
                "Check detailed information for each attendance session"
            ],
            image: "photo_student_history.png"
        },
        {
            id: 4,
            title: "Absent Attendance Tracking",
            description: "Monitor your absent records and pending attendance slots for better attendance management.",
            details: [
                "Navigate to 'Absent Attendance' tab",
                "View all your absent records with slot details",
                "Check pending attendance slots that require action",
                "Filter absent records by date or slot type",
                "Track patterns to improve attendance rate"
            ],
            image: "photo_student_absent.png"
        },
        {
            id: 5,
            title: "Leave Application System",
            description: "Apply for various types of leave with proper documentation and automated email processing.",
            details: [
                "Access 'Leave' tab for leave applications",
                "Choose from predefined leave types: Sick Leave, Personal Leave, Other Leave",
                "Select leave dates and specify duration",
                "Write detailed leave description and reasons",
                "Attach supporting documents if required",
                "Read all instructions carefully before submission",
                "System generates pre-written email with subject and body",
                "Review and send the automated leave request email"
            ],
            image: "photo_student_leave.png"
        },
        {
            id: 6,
            title: "Profile Management",
            description: "Manage your personal information and account security settings.",
            details: [
                "Access profile section from dashboard",
                "View and update personal details",
                "Change account password securely",
                "Update contact information",
                "Review account activity and settings"
            ],
            image: "photo_student_profile.png"
        }
    ];

    const renderSteps = (steps) => {
        return (
            <div className="space-y-12 md:space-y-16">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative">
                        {/* Step connector line */}
                        {index < steps.length - 1 && (
                            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-32 w-1 h-16 bg-indigo-200"></div>
                        )}

                        <div className={`md:grid md:grid-cols-2 md:gap-8 md:items-center ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                            <div className={`${index % 2 === 0 ? 'md:text-right md:pr-8' : 'md:order-last md:text-left md:pl-8'}`}>
                                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white mb-4">
                                    <span className="text-lg font-bold">{step.id}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 mb-4 text-lg">
                                    {step.description}
                                </p>
                                <ul className="space-y-2">
                                    {step.details.map((detail, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5 mr-2" />
                                            <span className="text-gray-700">{detail}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className={`mt-6 md:mt-0 ${index % 2 === 0 ? 'md:pl-8' : 'md:pr-8'}`}>
                                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                    <div className="aspect-video bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center">
                                        <div className="text-center">
                                            <Camera className="h-12 w-12 text-indigo-600 mx-auto mb-2" />
                                            <p className="text-sm text-indigo-600 font-medium">[{step.image}]</p>
                                            <p className="text-xs text-gray-500 mt-1">Screenshot will be placed here</p>
                                        </div>
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
            {/* Header */}
            <div className="fixed top-0 left-0 w-full z-50 bg-white mx-auto px-4 sm:px-6 lg:px-8 shadow-md">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex items-center justify-center space-x-1.5 cursor-pointer" onClick={() => navigate('/home')}>
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
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                        <h2 className="text-xl font-semibold text-gray-700">Documentation</h2>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl mt-36 shadow-sm border border-gray-200 p-6 sticky top-24">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h3>
                            <nav className="space-y-2">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeSection === section.id
                                            ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <section.icon className="h-5 w-5 mr-3" />
                                        {section.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 mt-8 lg:mt-0">
                        {activeSection === "overview" && (
                            <div className="bg-white rounded-xl mt-12 shadow-sm border border-gray-200 p-8">
                                <div className="text-center mb-12">
                                    <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                                        ScholarSync Documentation
                                    </h2>
                                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                        Smart Photo-Verified Attendance Management System for Educational Institutions
                                    </p>
                                </div>

                                {/* Important Notice */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                                    <div className="flex items-start">
                                        <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5 mr-3" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-amber-800 mb-2">Important Notice</h3>
                                            <p className="text-amber-700 leading-relaxed">
                                                This is an exact copy of our original webpage: <strong>scholarsync.online</strong>.
                                                The original version contains live data, so we've provided this test environment for you to explore.
                                                This testing version has the exact same features and functionality as the production system.
                                                You can perform any activity here as it's made specifically for testing purposes.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* System Overview */}
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">What is ScholarSync?</h3>
                                        <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                            ScholarSync is a comprehensive attendance management system that revolutionizes how educational institutions track student attendance.
                                            Using advanced photo verification technology, real-time analytics, and automated notifications, ScholarSync eliminates proxy attendance
                                            and provides accurate, reliable attendance tracking.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-indigo-50 p-6 rounded-xl">
                                            <Camera className="h-8 w-8 text-indigo-600 mb-3" />
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Photo Verification</h4>
                                            <p className="text-gray-600">Students mark attendance by taking a selfie, preventing proxy attendance through facial recognition.</p>
                                        </div>
                                        <div className="bg-blue-50 p-6 rounded-xl">
                                            <BarChart3 className="h-8 w-8 text-blue-600 mb-3" />
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Real-time Analytics</h4>
                                            <p className="text-gray-600">Comprehensive reports and analytics provide insights into attendance patterns and trends.</p>
                                        </div>
                                    </div>

                                    {/* Login Credentials */}
                                    <div className="bg-indigo-900 text-white rounded-xl p-6">
                                        <h3 className="text-xl font-bold mb-4">Super Admin Test Credentials</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-indigo-200 text-sm font-medium mb-1">Email:</label>
                                                <p className="bg-indigo-800 px-3 py-2 rounded font-mono">tarunvashisth0000@gmail.com</p>
                                            </div>
                                            <div>
                                                <label className="block text-indigo-200 text-sm font-medium mb-1">Password:</label>
                                                <p className="bg-indigo-800 px-3 py-2 rounded font-mono">Admin@123</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-indigo-800 rounded">
                                            <p className="text-indigo-200 text-sm mb-2">
                                                <strong>Note:</strong> You cannot create accounts independently because this is an attendance portal system.
                                                Random users cannot create accounts for security reasons.
                                            </p>
                                            <p className="text-indigo-200 text-sm">
                                                All student and teacher accounts must be created by administrators. When creating accounts,
                                                use authentic email addresses as users will receive their credentials and important updates via email.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Getting Started Process */}
                                    <div className="bg-gray-50 rounded-xl p-8">
                                        <div className="text-center mb-8">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Getting Started Process</h3>
                                            <p className="text-lg text-gray-600">Step-by-step guide to access ScholarSync system</p>
                                        </div>

                                        <div className="space-y-12">
                                            {/* Step 1 */}
                                            <div className="relative">
                                                <div className="md:grid md:grid-cols-2 md:gap-8 md:items-center">
                                                    <div className="md:text-right md:pr-8">
                                                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white mb-4">
                                                            <span className="text-lg font-bold">1</span>
                                                        </div>
                                                        <h4 className="text-xl font-bold text-gray-900 mb-3">
                                                            Click "Get Started" → Redirects to Login Page
                                                        </h4>
                                                        <p className="text-gray-600 text-lg mb-4">
                                                            Navigate from homepage to the secure login interface where you can access your account.
                                                        </p>
                                                        <ul className="space-y-2">
                                                            <li className="flex items-start">
                                                                <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5 mr-2" />
                                                                <span className="text-gray-700">Homepage "Get Started" button redirects automatically</span>
                                                            </li>
                                                            <li className="flex items-start">
                                                                <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5 mr-2" />
                                                                <span className="text-gray-700">Secure login page loads with credential input fields</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                    <div className="mt-6 md:mt-0 md:pl-8">
                                                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                                            <div className="aspect-video bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center">
                                                                <div className="text-center">
                                                                    <Camera className="h-12 w-12 text-indigo-600 mx-auto mb-2" />
                                                                    <p className="text-sm text-indigo-600 font-medium">[screenshot_1.png]</p>
                                                                    <p className="text-xs text-gray-500 mt-1">Login page screenshot</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Step 2 */}
                                            <div className="relative">
                                                <div className="md:grid md:grid-cols-2 md:gap-8 md:items-center">
                                                    <div className="md:order-last md:text-left md:pl-8">
                                                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white mb-4">
                                                            <span className="text-lg font-bold">2</span>
                                                        </div>
                                                        <h4 className="text-xl font-bold text-gray-900 mb-3">
                                                            Login Options Available
                                                        </h4>
                                                        <p className="text-gray-600 text-lg mb-4">
                                                            Multiple authentication options available based on your account type and access requirements.
                                                        </p>
                                                        <ul className="space-y-2">
                                                            <li className="flex items-start">
                                                                <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5 mr-2" />
                                                                <span className="text-gray-700">Use teacher/student credentials if available</span>
                                                            </li>
                                                            <li className="flex items-start">
                                                                <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5 mr-2" />
                                                                <span className="text-gray-700">Forgot password? Click "Forget Password" and enter email for reset</span>
                                                            </li>
                                                            <li className="flex items-start">
                                                                <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5 mr-2" />
                                                                <span className="text-gray-700">Use provided super admin credentials for full system access</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                    <div className="mt-6 md:mt-0 md:pr-8">
                                                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                                            <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                                                <div className="text-center">
                                                                    <Camera className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                                                                    <p className="text-sm text-blue-600 font-medium">[photo_2.png]</p>
                                                                    <p className="text-xs text-gray-500 mt-1">Login options screenshot</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "admin" && (
                            <div className="bg-white mt-12 rounded-xl shadow-sm border border-gray-200 p-8">
                                <div className="text-center mb-12">
                                    <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                                        Super Admin Guide
                                    </h2>
                                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                        Complete system administration with full access to all features and management tools
                                    </p>
                                </div>

                                {renderSteps(adminSteps)}

                                {/* Additional Admin Features */}
                                <div className="mt-16 bg-gray-50 rounded-xl p-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Complete Admin Dashboard Overview</h3>

                                    <div className="mb-8">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Analytics [photo_3]</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                                <h5 className="font-medium text-gray-700">Total Students</h5>
                                                <p className="text-sm text-gray-600">Complete student count across all classes</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                                <h5 className="font-medium text-gray-700">Total Teachers</h5>
                                                <p className="text-sm text-gray-600">Active teaching staff members</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                                <h5 className="font-medium text-gray-700">Active Slots</h5>
                                                <p className="text-sm text-gray-600">Currently running attendance sessions</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                                <h5 className="font-medium text-gray-700">Recent Attendance</h5>
                                                <p className="text-sm text-gray-600">Latest attendance submissions</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mb-8">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Sidebar Navigation Tabs</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border">
                                                    <Home className="h-5 w-5 text-indigo-600 mr-3" />
                                                    <span className="font-medium">Dashboard - Overview & Analytics</span>
                                                </div>
                                                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border">
                                                    <Users className="h-5 w-5 text-blue-600 mr-3" />
                                                    <span className="font-medium">Students - Complete Student Management</span>
                                                </div>
                                                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border">
                                                    <UserCheck className="h-5 w-5 text-green-600 mr-3" />
                                                    <span className="font-medium">Teachers - Teacher Account Management</span>
                                                </div>
                                                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border">
                                                    <FileText className="h-5 w-5 text-purple-600 mr-3" />
                                                    <span className="font-medium">Feedback Forms - Instant Student Surveys</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border">
                                                    <Clock className="h-5 w-5 text-orange-600 mr-3" />
                                                    <span className="font-medium">Attendance Slots - Session Management</span>
                                                </div>
                                                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border">
                                                    <BarChart3 className="h-5 w-5 text-red-600 mr-3" />
                                                    <span className="font-medium">Attendance Stats - Analytics & Reports</span>
                                                </div>
                                                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border">
                                                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                                                    <span className="font-medium">Absent Students - Absence Tracking</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-6 rounded-lg">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Important Admin Notes</h4>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>• Notification icon in navbar currently routes to email system instead of in-app notifications</li>
                                            <li>• All student and teacher account creation sends automatic email with credentials</li>
                                            <li>• Deleting students removes ALL associated attendance records permanently</li>
                                            <li>• Deleting slots removes ALL present/absent records for that session</li>
                                            <li>• Bulk upload supports CSV/Excel with downloadable templates</li>
                                            <li>• Export functionality available for all attendance data</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "teacher" && (
                            <div className="bg-white mt-12 rounded-xl shadow-sm border border-gray-200 p-8">
                                <div className="text-center mb-12">
                                    <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                                        Teacher Guide
                                    </h2>
                                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                        Manage your classes and track student attendance with limited administrative permissions
                                    </p>
                                </div>

                                {renderSteps(teacherSteps)}

                                {/* Teacher Permissions and Access Note */}
                                <div className="mt-12 bg-amber-50 border border-amber-200 rounded-xl p-6">
                                    <div className="flex items-start">
                                        <Shield className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5 mr-3" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-amber-800 mb-2">Teacher Permissions & Limitations</h3>
                                            <div className="text-amber-700 space-y-2">
                                                <p>
                                                    <strong>Similar UI to Admin:</strong> Teachers have the same interface design as administrators but with restricted permissions for security and data integrity.
                                                </p>
                                                <p>
                                                    <strong>Cannot Delete:</strong> Teachers cannot delete students or attendance slots due to security reasons. This prevents accidental data loss and maintains audit trails.
                                                </p>
                                                <p>
                                                    <strong>Limited Student Management:</strong> Teachers can view and edit basic student information but cannot perform bulk operations or account deletions.
                                                </p>
                                                <p>
                                                    <strong>Class-Specific Access:</strong> Teachers can only manage attendance and view analytics for their assigned classes and subjects.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Teacher Account Creation Process */}
                                <div className="mt-8 bg-blue-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Create Teacher Accounts (Admin Process)</h3>
                                    <div className="space-y-3 text-gray-700">
                                        <div className="flex items-start">
                                            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">1</div>
                                            <span>Admin navigates to Teachers tab and clicks "Add New Teacher"</span>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">2</div>
                                            <span>Fill in teacher details with authentic email address</span>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">3</div>
                                            <span>Teacher receives welcome email with login credentials automatically</span>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">4</div>
                                            <span>Teacher can login and explore all available features with limited permissions</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "student" && (
                            <div className="bg-white mt-12 rounded-xl shadow-sm border border-gray-200 p-8">
                                <div className="text-center mb-12">
                                    <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                                        Student Guide
                                    </h2>
                                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                        Mark your attendance, view history, and manage your academic records
                                    </p>
                                </div>

                                {renderSteps(studentSteps)}

                                {/* Student Features Overview */}
                                <div className="mt-16 bg-indigo-50 rounded-xl p-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Complete Student Experience Overview</h3>

                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Account Creation & Access</h4>
                                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                                            <p className="text-gray-700 mb-2">
                                                <strong>Important:</strong> Students cannot create accounts independently. All student accounts are created by administrators to ensure security and proper enrollment verification.
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                When administrators create student accounts, students receive their login credentials via email along with welcome instructions.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start">
                                                <CheckCircle className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Dashboard Analytics</h4>
                                                    <p className="text-gray-600">Real-time attendance rate calculation, total presents/absents, and active slots overview</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <CheckCircle className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Quick Actions Panel</h4>
                                                    <p className="text-gray-600">Two main buttons: "Mark Attendance" and "Apply Leave" for instant access</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <CheckCircle className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Active & Upcoming Slots</h4>
                                                    <p className="text-gray-600">Live listing of attendance sessions with status indicators</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-start">
                                                <CheckCircle className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Profile Management</h4>
                                                    <p className="text-gray-600">Update personal details and change password securely</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <CheckCircle className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Photo Verification System</h4>
                                                    <p className="text-gray-600">Take selfie → Review → Submit with location data for accurate attendance</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <CheckCircle className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Comprehensive History Tracking</h4>
                                                    <p className="text-gray-600">View all attendance records with photos, locations, and timestamps</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Leave Application Process Details</h4>
                                        <div className="space-y-2 text-gray-700">
                                            <p><strong>Step 1:</strong> Choose from predefined leave types: Sick Leave, Personal Leave, Other Leave</p>
                                            <p><strong>Step 2:</strong> Select specific leave dates and mention duration</p>
                                            <p><strong>Step 3:</strong> Write detailed description and reason for leave</p>
                                            <p><strong>Step 4:</strong> Attach supporting documents if required</p>
                                            <p><strong>Step 5:</strong> Read all instructions carefully before proceeding</p>
                                            <p><strong>Step 6:</strong> System generates pre-written email with proper subject and body</p>
                                            <p><strong>Step 7:</strong> Review the automated email and send to appropriate authorities</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center space-y-2">
                        <div>
                            <div className="flex items-center justify-center space-x-1.5 cursor-pointer" onClick={() => navigate('/home')}>
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
                            <p className="text-gray-400 text-center">Smart attendance management for modern educational institutions.</p>

                            {/* Contact Links */}
                            <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-4 mt-3">
                                <a
                                    href="mailto:tarunvashisth0000@gmail.com"
                                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm flex items-center space-x-1"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    <span>tarunvashisth0000@gmail.com</span>
                                </a>
                                <a
                                    href="tel:+917082889441"
                                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm flex items-center space-x-1"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    <span>+917082889441</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-1 pb-1 mt-6 text-center text-gray-400">
                        <p>&copy; {new Date().getFullYear()} ScholarSync. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DocumentationPage;