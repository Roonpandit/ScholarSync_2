import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  Clock,
  AlertCircle,
  Info,
  Mail,
  X,
  AlertTriangle,
  Stethoscope,
  Users,
  ArrowLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { formatDateDisplay, convertToIST, getCurrentDateIST } from "../../utils/timeUtils";

const Leave = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialLeaveType = query.get("type") || "sick";

  const [leaveType, setLeaveType] = useState(initialLeaveType);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    details: "",
  });
  const [errors, setErrors] = useState({});
  const [hasReadInstructions, setHasReadInstructions] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.details.trim())
      newErrors.details = "Please provide details about your leave";
    if (!hasReadInstructions)
      newErrors.readInstructions =
        "Please confirm that you have read the instructions";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Format email subject and body
    const subject = `${
      leaveType === "sick"
        ? "Sick Leave"
        : leaveType === "personal"
        ? "Personal Leave"
        : "Leave Application"
    } - ${user?.name} - ${formData.startDate} to ${formData.endDate}`;

    const body =
      `Dear Sir/Madam,\n\nI am writing to apply for ${
        leaveType === "sick"
          ? "sick leave"
          : leaveType === "personal"
          ? "personal leave"
          : "leave"
      } from ${formData.startDate} to ${formData.endDate}.\n\n` +
      `Details:\n${formData.details}\n\n` +
      `Student Details:\n` +
      `Name: ${user?.name || "N/A"}\n` +
      `Student ID: ${user?.studentCode || "N/A"}\n` +
      `Contact: ${user?.phone || "N/A"}\n\n` +
      `Thank you for your consideration.\n\n` +
      `Sincerely,\n${user?.name || "Student"}`;

    // Open default email client
    window.location.href = `mailto:tarunvashisth0000@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const getLeaveInstructions = () => {
    if (leaveType === "sick") {
      return {
        title: "Sick Leave Application",
        instructions: [
          "Fill in the subject as: Sick Leave - [Your Name] - [Date Range]",
          "In the description, include:",
          "  • Nature of illness",
          "  • Duration of leave required",
          "  • Doctor's name and contact if applicable",
          "Attach medical certificate/prescription if available",
          "Note: Medical certificate is mandatory for leaves longer than 2 days.",
        ],
        icon: <Stethoscope className="w-6 h-6 text-red-500" />,
        color: "red",
      };
    } else if (leaveType === "personal") {
      return {
        title: "Personal Leave Application",
        instructions: [
          "Fill in the subject as: Personal Leave - [Your Name] - [Date Range]",
          "In the description, include:",
          "  • Reason for leave (family emergency, etc.)",
          "  • Duration of leave required",
          "  • Emergency contact number of family member",
          "Attach supporting documents if applicable",
          "Please provide at least 24 hours notice for non-emergency leaves.",
        ],
        icon: <Users className="w-6 h-6 text-blue-500" />,
        color: "blue",
      };
    } else {
      return {
        title: "Leave Application",
        instructions: [
          "Fill in the subject as: Leave Application - [Your Name] - [Date Range]",
          "In the description, clearly mention:",
          "  • Type of leave (e.g., vacation, family event, etc.)",
          "  • Reason for leave",
          "  • Duration of leave required",
          "  • Any other relevant details",
          "Please submit your request at least 3 days in advance for non-emergency leaves.",
        ],
        icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
        color: "yellow",
      };
    }
  };

  const instructions = getLeaveInstructions();

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Apply for Leave</h2>
          <p className="text-gray-500">
            Please fill out the form below to submit your leave request
          </p>
        </div>

        {/* Leave Type Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {["sick", "personal", "other"].map((type) => (
            <button
              key={type}
              onClick={() => setLeaveType(type)}
              className={`p-4 rounded-lg transition-all duration-200 ${
                leaveType === type
                  ? type === "sick"
                    ? "bg-red-50 border-2 border-red-500"
                    : type === "personal"
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-yellow-50 border-2 border-yellow-500"
                  : "bg-white border border-gray-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {type === "sick" ? (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4">
                      <Stethoscope className="w-5 h-5 text-red-500" />
                    </div>
                  ) : type === "personal" ? (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    </div>
                  )}
                  <div className="text-left">
                    <h3 className="font-medium capitalize text-gray-800">
                      {type === "sick"
                        ? "Sick Leave"
                        : type === "personal"
                        ? "Personal Leave"
                        : "Other Leave"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {type === "sick"
                        ? "For medical reasons"
                        : type === "personal"
                        ? "For personal matters"
                        : "For other purposes"}
                    </p>
                  </div>
                </div>
                {leaveType === type && (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      type === "sick"
                        ? "bg-red-500"
                        : type === "personal"
                        ? "bg-blue-500"
                        : "bg-yellow-500"
                    }`}
                  >
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Form Header */}
          <div
            className={`px-6 py-4 ${
              leaveType === "sick"
                ? "bg-red-50"
                : leaveType === "personal"
                ? "bg-blue-50"
                : "bg-yellow-50"
            }`}
          >
            <div className="flex items-center">
              {instructions.icon}
              <h3 className="ml-2 text-lg font-semibold">
                {instructions.title}
              </h3>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6 border-b border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-3">
                <Info className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800 ml-2">
                  Important Instructions
                </h3>
              </div>
              <ul className="space-y-2">
                {instructions.instructions.map((instruction, index) => {
                  const isImportantNote =
                    instruction.includes("Medical certificate is mandatory") ||
                    instruction.includes(
                      "Please provide at least 24 hours notice"
                    ) ||
                    instruction.includes(
                      "Please submit your request at least 3 days"
                    );

                  return (
                    <li
                      key={index}
                      className={`flex items-start ${
                        isImportantNote
                          ? "bg-red-50 text-red-700 p-2 rounded-md"
                          : ""
                      }`}
                    >
                      {isImportantNote ? (
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      ) : (
                        <span className="text-gray-400 mr-2">•</span>
                      )}
                      <span className="text-sm">{instruction}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>


          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Leave Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        className={`w-full pl-10 pr-3 py-2 border ${
                          errors.startDate
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.startDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        min={
                          formData.startDate ||
                          new Date().toISOString().split("T")[0]
                        }
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2 border ${
                          errors.endDate ? "border-red-500" : "border-gray-300"
                        } rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.endDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="details"
                  rows={4}
                  value={formData.details}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.details ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Please provide all necessary details about your leave..."
                />
                {errors.details && (
                  <p className="mt-1 text-sm text-red-600">{errors.details}</p>
                )}
              </div>

              {/* Student Information Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Student Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{user?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Student ID</p>
                    <p className="font-medium">{user?.studentCode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Contact</p>
                    <p className="font-medium">{user?.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start pt-4">
                <div className="flex items-center h-5">
                  <input
                    id="read-instructions"
                    name="read-instructions"
                    type="checkbox"
                    checked={hasReadInstructions}
                    onChange={(e) => setHasReadInstructions(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="read-instructions"
                    className="font-medium text-gray-700"
                  >
                    I have read and understood all the instructions above
                  </label>
                  {errors.readInstructions && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.readInstructions}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
                    leaveType === "sick"
                      ? "bg-red-600 hover:bg-red-700"
                      : leaveType === "personal"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  } flex items-center justify-center`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Submit Leave Request
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Help Card */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100 flex items-center">
          <div className="rounded-full bg-blue-100 p-2 mr-4">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-800">
              Need help with your leave application?
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Contact student support at tarunvashisth0000@gmail.com or call +917082889441
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leave;
