import { useState } from "react";
import {
    Users,
    UserCheck,
    Clock,
    BarChart3,
    Camera,
    Shield,
    ChevronRight,
    Home,
    CheckCircle,
    X,
    ZoomIn,
    Menu,
    BookOpen,
    FileText,
    AlertTriangle,
    Mail,
    Phone
} from "lucide-react";

const TeachersGuide = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const teacherSteps = [
        {
            id: 1,
            title: "Teacher Dashboard Overview",
            description: "Access your personalized teacher dashboard with comprehensive class management tools and attendance oversight capabilities.",
            details: [
                "Login using the credentials provided via email when your account was created by the administrator",
                "View your personalized dashboard displaying all assigned classes and current teaching schedule",
                "Monitor real-time attendance statistics for all your classes with visual analytics",
                "Access quick navigation panel with all teaching tools and student management options",
                "View upcoming and active attendance slots for seamless class management",
                "Check recent attendance activities and system notifications relevant to your classes",
                "Note: Teacher accounts have enhanced security with limited administrative permissions for data protection"
            ],
            image: "photo_9.png"
        },
        {
            id: 2,
            title: "Creating & Managing Attendance Slots",
            description: "Set up and manage attendance tracking sessions for your classes with precise timing controls and student group assignments.",
            details: [
                "Navigate to 'Attendance Slots' section from the main sidebar menu",
                "Click 'Create New Slot' to set up attendance sessions for your classes",
                "Configure slot details: date, start time, duration, and attendance window parameters",
                "Assign slots to specific classes, subjects, or custom student groups under your supervision",
                "Set location requirements and photo verification parameters for accurate tracking",
                "Monitor slot status in real-time: upcoming (blue), active (green), expired (gray)",
                "Edit slot details before activation, but note that active slots cannot be modified",
                "View comprehensive slot analytics including participation rates and completion statistics",
                "Important: Teachers cannot delete slots due to security protocols - contact admin if deletion is needed"
            ],
            image: "photo_10.png"
        },
        {
            id: 3,
            title: "Real-Time Attendance Monitoring",
            description: "Track student attendance in real-time with live photo verification, location tracking, and instant completion notifications.",
            details: [
                "Access live monitoring dashboard during active attendance sessions",
                "View students checking in real-time with timestamp tracking and completion status",
                "Verify student attendance photos as they submit - photos appear instantly for review",
                "Monitor location data to ensure students are marking attendance from appropriate locations",
                "Track attendance completion percentage with live progress indicators",
                "Receive instant notifications when students mark attendance or encounter issues",
                "View detailed session analytics including early arrivals, on-time attendance, and late submissions",
                "Export real-time attendance data to Excel format for record-keeping and analysis",
                "Address attendance discrepancies immediately with built-in messaging system"
            ],
            image: "photo_11.png"
        },
        {
            id: 4,
            title: "Student Management (Limited Access)",
            description: "Manage students within your assigned classes with secure, limited permissions designed to protect sensitive student data.",
            details: [
                "Access 'Students' tab to view comprehensive list of students in your assigned classes",
                "Search students efficiently by name, student ID, or enrollment number",
                "View detailed student profiles including attendance history, academic performance metrics",
                "Edit limited student information: contact details, class assignments, and academic notes",
                "Track individual student attendance patterns with visual charts and trend analysis",
                "View student attendance photos and verification history for your classes only",
                "Monitor student engagement levels and identify attendance concerns early",
                "Generate individual student reports for parent-teacher conferences and academic reviews",
                "Important Security Note: Teachers cannot delete student accounts or access sensitive personal information"
            ],
            image: "photo_12.png"
        },
        {
            id: 5,
            title: "Attendance Reports & Analytics",
            description: "Generate comprehensive attendance reports with advanced filtering options and detailed analytics for your teaching assignments.",
            details: [
                "Access 'Attendance Statistics' for detailed analytics of all your classes",
                "Generate class-wise attendance reports with customizable date ranges and filtering options",
                "Filter data by specific students, attendance status (present/absent), or time periods",
                "View attendance trends with graphical representations including line charts and bar graphs",
                "Analyze student attendance patterns to identify concerning trends or improvements",
                "Export detailed reports to Excel format for administrative purposes and parent communications",
                "Calculate and track individual student attendance percentages with automatic grading integration",
                "Create monthly and semester attendance summaries for academic record maintenance",
                "Share reports with administrators and parents through secure email integration",
                "Set up automated attendance alerts for students with declining attendance rates"
            ],
            image: "photo_13.png"
        },
        {
            id: 6,
            title: "Communication & Notifications",
            description: "Stay connected with students, parents, and administration through integrated communication tools and automated notification systems.",
            details: [
                "Receive instant email notifications when students mark attendance in your classes",
                "Send bulk notifications to students about upcoming attendance slots or class changes",
                "Access integrated messaging system for direct communication with students",
                "Receive automated alerts for students with low attendance rates in your subjects",
                "View system-wide announcements and important updates from school administration",
                "Send attendance reports directly to parents through secure email system",
                "Receive technical support notifications and system maintenance alerts",
                "Access emergency notification system for urgent student safety communications"
            ],
            image: "photo_9.png"
        }
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
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{selectedImage.alt}</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Click outside the image to close</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Image component with fallback and click handler
    const ImageWithFallback = ({ src, alt, className }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoading, setImageLoading] = useState(true);

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
                        <p className="text-xs sm:text-sm text-indigo-600 font-medium break-all">[{src.split('/').pop()}]</p>
                        <p className="text-xs text-gray-500 mt-1">Screenshot not available</p>
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
                    style={{ display: imageLoading ? 'none' : 'block' }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer" onClick={handleImageClick}>
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

    const renderSteps = (steps) => {
        return (
            <div className="space-y-12 md:space-y-16">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative">
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
                                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                        <ImageWithFallback
                                            src={step.image.startsWith('/') ? step.image : `/docs/${step.image}`}
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
                                        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                                    />
                                </div>
                                <h1 className="text-xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-blue-500 to-indigo-900 text-transparent bg-clip-text" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                                    ScholarSync
                                </h1>
                            </div>
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-1 sm:mx-2" />
                            <h2 className="text-sm sm:text-xl font-semibold text-gray-700">Teacher Guide</h2>
                        </div>

                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
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
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                                Welcome to ScholarSync Teacher Portal
                            </h1>
                            <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
                                Your comprehensive guide to managing student attendance, tracking academic progress, and streamlining classroom administration
                            </p>
                        </div>

                        {/* Portal Access Information */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 sm:p-6 mb-6">
                            <div className="flex items-start">
                                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 flex-shrink-0 mt-0.5 mr-3" />
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-indigo-800 mb-2">Teacher Portal Access</h3>
                                    <div className="text-sm sm:text-base text-indigo-700 leading-relaxed space-y-2">
                                        <p>
                                            <strong>Portal URL:</strong> <a href="https://scholarsync.online/" target="_blank" rel="noopener noreferrer" className="text-indigo-800 font-semibold hover:underline">https://scholarsync.online/</a>
                                        </p>
                                        <p>
                                            <strong>Login Credentials:</strong> You have received your login credentials via email when your account was created by the school administrator. Please check your inbox for the welcome email containing your username and password.
                                        </p>
                                        <p>
                                            <strong>First Time Login:</strong> After logging in for the first time, you'll be prompted to change your password for security purposes. Please choose a strong password that you can remember.
                                        </p>
                                        <p>
                                            <strong>Forgot Password:</strong> If you cannot locate your credentials or need to reset your password, use the "Forgot Password" link on the login page and enter your registered email address.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Teacher Permissions Overview */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
                            <div className="flex items-start">
                                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 flex-shrink-0 mt-0.5 mr-3" />
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-amber-800 mb-2">Teacher Account Permissions</h3>
                                    <div className="text-sm sm:text-base text-amber-700 leading-relaxed space-y-2">
                                        <p>
                                            <strong>Enhanced Security:</strong> Your teacher account has been configured with specific permissions to ensure data security and prevent accidental modifications to critical student records.
                                        </p>
                                        <p>
                                            <strong>Cannot Delete:</strong> For security reasons, teachers cannot delete student accounts or attendance slots. This preserves academic records and maintains proper audit trails.
                                        </p>
                                        <p>
                                            <strong>Class-Specific Access:</strong> You can only view and manage students assigned to your classes, ensuring privacy and data protection.
                                        </p>
                                        <p>
                                            <strong>Administrative Support:</strong> If you need to make changes that require administrative privileges, please contact the school's ScholarSync administrator.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step-by-Step Guide */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
                        <div className="text-center mb-8 sm:mb-12">
                            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4">Complete Teacher Guide</h2>
                            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
                                Follow these detailed steps to master all features of the ScholarSync Teacher Portal
                            </p>
                        </div>

                        {renderSteps(teacherSteps)}
                    </div>

                    {/* Quick Reference Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 mt-8">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Quick Reference & Tips</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                                        <Clock className="h-5 w-5 text-blue-600 mr-2" />
                                        Best Practices for Attendance Slots
                                    </h4>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        <li>• Create slots 15-30 minutes before class starts</li>
                                        <li>• Set appropriate duration (usually 10-15 minutes)</li>
                                        <li>• Include location requirements for accuracy</li>
                                        <li>• Monitor slots during active periods</li>
                                    </ul>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                                        <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
                                        Effective Report Generation
                                    </h4>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        <li>• Generate weekly reports for better tracking</li>
                                        <li>• Use date filters for specific periods</li>
                                        <li>• Export data for parent meetings</li>
                                        <li>• Share reports with administration monthly</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                                        <Users className="h-5 w-5 text-purple-600 mr-2" />
                                        Student Management Tips
                                    </h4>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        <li>• Regularly review student profiles</li>
                                        <li>• Monitor attendance patterns weekly</li>
                                        <li>• Address low attendance early</li>
                                        <li>• Keep contact information updated</li>
                                    </ul>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                                        <Camera className="h-5 w-5 text-orange-600 mr-2" />
                                        Photo Verification Guidelines
                                    </h4>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        <li>• Review attendance photos regularly</li>
                                        <li>• Report suspicious submissions</li>
                                        <li>• Ensure students understand photo requirements</li>
                                        <li>• Check location data for discrepancies</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support Section */}
                    <div className="bg-gray-900 rounded-xl text-white p-4 sm:p-8 mt-8">
                        <div className="text-center mb-6">
                            <h3 className="text-xl sm:text-2xl font-bold mb-4">Need Help?</h3>
                            <p className="text-gray-300 mb-6">Our support team is here to assist you with any questions or technical issues.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="text-center">
                                <Mail className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                <h4 className="text-lg font-semibold mb-2">Email Support</h4>
                                <a href="mailto:tarunvashisth0000@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                                    tarunvashisth0000@gmail.com
                                </a>
                                <p className="text-gray-400 text-sm mt-1">Response within 24 hours</p>
                            </div>
                            <div className="text-center">
                                <Phone className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                <h4 className="text-lg font-semibold mb-2">Phone Support</h4>
                                <a href="tel:+917082889441" className="text-green-400 hover:text-green-300 transition-colors">
                                    +91 7082889441
                                </a>
                                <p className="text-gray-400 text-sm mt-1">Mon-Fri, 9 AM - 6 PM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center space-y-2">
                        <div>
                            <div className="flex items-center justify-center space-x-1.5 cursor-pointer" onClick={() => navigate('/home')}>
                                <div className="h-6 w-6 sm:h-8 sm:w-8 transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
                                    <img
                                        src="/logo.png"
                                        alt="Logo"
                                        className="h-full w-full object-contain"
                                        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                                    />
                                </div>
                                <h1 className="text-xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-blue-100 to-indigo-900 text-transparent bg-clip-text" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                                    ScholarSync
                                </h1>
                            </div>
                            <p className="text-gray-400 text-center text-sm sm:text-base">Smart attendance management for modern educational institutions.</p>

                            {/* Contact Links */}
                            <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-4 mt-3">
                                <a
                                    href="mailto:tarunvashisth0000@gmail.com"
                                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-xs sm:text-sm flex items-center space-x-1"
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    <span className="break-all">tarunvashisth0000@gmail.com</span>
                                </a>
                                <a
                                    href="tel:+917082889441"
                                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-xs sm:text-sm flex items-center space-x-1"
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    <span>+917082889441</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-1 pb-1 mt-6 text-center text-gray-400">
                        <p className="text-xs sm:text-sm">&copy; {new Date().getFullYear()} ScholarSync. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TeachersGuide;