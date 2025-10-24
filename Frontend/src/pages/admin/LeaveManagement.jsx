import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  Eye,
  User,
  Stethoscope,
  AlertTriangle,
  FileText,
  Search,
  RefreshCw,
  TrendingUp,
  Users,
  Ban
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const AdminLeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    lecture: "",
    teacher: "",
    student: "",
    status: "",
    fromDate: "",
    toDate: ""
  });
  const [stats, setStats] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Dropdown data
  const [lectures, setLectures] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchLeaveRequests();
    fetchStats();
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      // Fetch lectures
      const lecturesRes = await axios.get('/lectures');
      setLectures(lecturesRes.data.data || []);

      // Fetch teachers
      const teachersRes = await axios.get('/admin/teachers');
      setTeachers(teachersRes.data.data || []);

      // Fetch students
      const studentsRes = await axios.get('/admin/students');
      setStudents(studentsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/admin/leave/all', {
        params: {
          lecture: filters.lecture || undefined,
          teacher: filters.teacher || undefined,
          student: filters.student || undefined,
          status: filters.status || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined
        }
      });
      setLeaveRequests(response.data.data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/leave/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" />, text: "Pending" },
      approved: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" />, text: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" />, text: "Rejected" },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: <Ban className="w-3 h-3" />, text: "Cancelled" },
      closed: { color: "bg-gray-100 text-gray-600", icon: <XCircle className="w-3 h-3" />, text: "Closed" }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const calculateDays = (fromDate, toDate) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  const renderRequestCard = (request) => (
    <div
      key={request._id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
        {/* Student & Teacher Info */}
        <div className="flex-1 mb-3 lg:mb-0">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">{request.studentId?.name || "N/A"}</h3>
              <p className="text-sm text-gray-500">{request.studentId?.studentCode || "N/A"}</p>
            </div>
          </div>
          <div className="ml-13 text-sm text-gray-600">
            <p><span className="font-medium">Teacher:</span> {request.teacherId?.name || "N/A"}</p>
            <p><span className="font-medium">Lecture:</span> {request.lectureId?.name || "N/A"}</p>
          </div>
        </div>

        {/* Leave Type & Status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            request.leaveType === "sick" ? "bg-red-50" : "bg-blue-50"
          }`}>
            {request.leaveType === "sick" ? (
              <Stethoscope className="w-4 h-4 text-red-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-blue-600" />
            )}
            <span className={`text-sm font-medium ${
              request.leaveType === "sick" ? "text-red-700" : "text-blue-700"
            }`}>
              {request.leaveType === "sick" ? "Sick Leave" : "Other Leave"}
            </span>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </div>

      {/* Leave Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500 mb-1">Duration</p>
          <div className="flex items-center text-gray-900">
            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
            <span className="font-medium">
              {formatDate(request.fromDate)} - {formatDate(request.toDate)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {calculateDays(request.fromDate, request.toDate)} day(s)
          </p>
        </div>

        <div>
          <p className="text-gray-500 mb-1">Applied On</p>
          <p className="font-medium text-gray-900">{formatDate(request.appliedAt)}</p>
        </div>

        {request.approvedAt && (
          <div>
            <p className="text-gray-500 mb-1">Approved On</p>
            <p className="font-medium text-gray-900">{formatDate(request.approvedAt)}</p>
          </div>
        )}

        {request.rejectedAt && (
          <div>
            <p className="text-gray-500 mb-1">Rejected On</p>
            <p className="font-medium text-gray-900">{formatDate(request.rejectedAt)}</p>
          </div>
        )}
      </div>

      {/* Reason */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Reason</p>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{request.reason}</p>
      </div>

      {/* Teacher Remark */}
      {request.teacherRemark && (
        <div className="mb-4 p-3 bg-red-50 rounded-md">
          <p className="text-sm text-red-700 font-medium mb-1">Teacher&apos;s Rejection Remark</p>
          <p className="text-sm text-red-600">{request.teacherRemark}</p>
        </div>
      )}

      {/* Student Remark */}
      {request.studentRemark && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700 font-medium mb-1">Student&apos;s Remark (Resent)</p>
          <p className="text-sm text-blue-600">{request.studentRemark}</p>
        </div>
      )}

      {/* Cancellation Info */}
      {request.cancelReason && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700 font-medium mb-1">Cancellation Reason</p>
          <p className="text-sm text-gray-600">{request.cancelReason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            setSelectedRequest(request);
            setShowDetailModal(true);
          }}
          className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4 mr-1.5" />
          View Full Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-600 mt-1">Monitor and manage all student leave requests</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.statusStats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.statusStats.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.statusStats.approved}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.statusStats.rejected}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.statusStats.cancelled}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Ban className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leave Type Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg shadow-sm border border-red-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium mb-1">Sick Leave Requests</p>
                  <p className="text-3xl font-bold text-red-900">{stats.typeStats.sick}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Other Leave Requests</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.typeStats.other}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-gray-600 mr-2" />
              <span className="font-medium">Advanced Filters</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student
                  </label>
                  <select
                    value={filters.student}
                    onChange={(e) => setFilters({ ...filters, student: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Students</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.studentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher
                  </label>
                  <select
                    value={filters.teacher}
                    onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Teachers</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lecture
                  </label>
                  <select
                    value={filters.lecture}
                    onChange={(e) => setFilters({ ...filters, lecture: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Lectures</option>
                    {lectures.map((lecture) => (
                      <option key={lecture._id} value={lecture._id}>
                        {lecture.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={fetchLeaveRequests}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  <Search className="w-4 h-4 inline mr-2" />
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    setFilters({ lecture: "", teacher: "", student: "", status: "", fromDate: "", toDate: "" });
                    fetchLeaveRequests();
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              fetchLeaveRequests();
              fetchStats();
            }}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading requests...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaveRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No leave requests found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              leaveRequests.map(renderRequestCard)
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-semibold">Complete Leave Request Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Student Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Name</p>
                    <p className="font-medium text-blue-900">{selectedRequest.studentId?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Student Code</p>
                    <p className="font-medium text-blue-900">{selectedRequest.studentId?.studentCode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Email</p>
                    <p className="font-medium text-blue-900">{selectedRequest.studentId?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Phone</p>
                    <p className="font-medium text-blue-900">{selectedRequest.studentId?.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Teacher & Lecture Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-900 mb-2">Teacher</h4>
                  <p className="font-medium text-purple-900">{selectedRequest.teacherId?.name || "N/A"}</p>
                  <p className="text-sm text-purple-700">{selectedRequest.teacherId?.teacherCode || "N/A"}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Lecture</h4>
                  <p className="font-medium text-green-900">{selectedRequest.lectureId?.name || "N/A"}</p>
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Leave Type</p>
                  <div className="mt-1">
                    {selectedRequest.leaveType === "sick" ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg">
                        <Stethoscope className="w-4 h-4" />
                        <span className="font-medium">Sick Leave</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Other Leave</span>
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">From Date</p>
                  <p className="font-medium">{formatDate(selectedRequest.fromDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To Date</p>
                  <p className="font-medium">{formatDate(selectedRequest.toDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">
                    {calculateDays(selectedRequest.fromDate, selectedRequest.toDate)} day(s)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Applied On</p>
                  <p className="font-medium">{formatDate(selectedRequest.appliedAt)}</p>
                </div>
                {selectedRequest.approvedAt && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Approved On</p>
                      <p className="font-medium">{formatDate(selectedRequest.approvedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Approved By</p>
                      <p className="font-medium">{selectedRequest.respondedBy?.name || "N/A"}</p>
                    </div>
                  </>
                )}
                {selectedRequest.rejectedAt && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Rejected On</p>
                      <p className="font-medium">{formatDate(selectedRequest.rejectedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expires At</p>
                      <p className="font-medium">
                        {selectedRequest.rejectExpiresAt ? formatDate(selectedRequest.rejectExpiresAt) : "N/A"}
                      </p>
                    </div>
                  </>
                )}
                {selectedRequest.cancelledAt && (
                  <div>
                    <p className="text-sm text-gray-500">Cancelled On</p>
                    <p className="font-medium">{formatDate(selectedRequest.cancelledAt)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Resend Count</p>
                  <p className="font-medium">{selectedRequest.resendCount || 0}/1</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Reason for Leave</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedRequest.reason}</p>
                </div>
              </div>

              {/* Remarks */}
              {selectedRequest.teacherRemark && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 font-medium mb-2">Teacher&apos;s Rejection Remark</p>
                  <p className="text-red-600">{selectedRequest.teacherRemark}</p>
                </div>
              )}

              {selectedRequest.studentRemark && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-2">Student&apos;s Remark (When Resent)</p>
                  <p className="text-blue-600">{selectedRequest.studentRemark}</p>
                </div>
              )}

              {selectedRequest.cancelReason && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium mb-2">Cancellation Reason</p>
                  <p className="text-gray-600">{selectedRequest.cancelReason}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveManagement;
