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
  RefreshCw
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const TeacherLeaveManagement = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    batch: "",
    student: "",
    status: "",
    fromDate: "",
    toDate: ""
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [teacherRemark, setTeacherRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingRequests();
    } else {
      fetchAllRequests();
    }
  }, [activeTab]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/teacher/leave/pending');
      setPendingRequests(response.data.data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast.error("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/teacher/leave/all', {
        params: {
          status: filters.status || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined
        }
      });
      setAllRequests(response.data.data);
    } catch (error) {
      console.error("Error fetching all requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm("Are you sure you want to approve this leave request?")) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`/teacher/leave/${requestId}/approve`);
      toast.success("Leave request approved successfully");

      if (activeTab === "pending") {
        fetchPendingRequests();
      } else {
        fetchAllRequests();
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(error.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!teacherRemark.trim()) {
      toast.error("Please provide a remark for rejection");
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`/teacher/leave/${selectedRequest._id}/reject`, { teacherRemark });
      toast.success("Leave request rejected successfully");
      setShowRejectModal(false);
      setTeacherRemark("");
      setSelectedRequest(null);

      if (activeTab === "pending") {
        fetchPendingRequests();
      } else {
        fetchAllRequests();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(error.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" />, text: "Pending" },
      approved: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" />, text: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" />, text: "Rejected" },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: <XCircle className="w-3 h-3" />, text: "Cancelled" },
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
        {/* Student Info */}
        <div className="flex items-center mb-3 lg:mb-0">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-gray-900">{request.studentId?.name || "N/A"}</h3>
            <p className="text-sm text-gray-500">{request.studentId?.studentCode || "N/A"}</p>
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
          <p className="text-gray-500 mb-1">Batch</p>
          <p className="font-medium text-gray-900">{request.batchId?.name || "N/A"}</p>
        </div>

        <div>
          <p className="text-gray-500 mb-1">Applied On</p>
          <p className="font-medium text-gray-900">{formatDate(request.appliedAt)}</p>
        </div>
      </div>

      {/* Reason */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Reason</p>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{request.reason}</p>
      </div>

      {/* Student Remark (if resent) */}
      {request.studentRemark && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700 font-medium mb-1">Student&apos;s Remark (Resent)</p>
          <p className="text-sm text-blue-600">{request.studentRemark}</p>
        </div>
      )}

      {/* Teacher Remark (if rejected) */}
      {request.teacherRemark && (
        <div className="mb-4 p-3 bg-red-50 rounded-md">
          <p className="text-sm text-red-700 font-medium mb-1">Your Rejection Remark</p>
          <p className="text-sm text-red-600">{request.teacherRemark}</p>
        </div>
      )}

      {/* Approval Info */}
      {request.status === "approved" && request.approvedAt && (
        <div className="mb-4 p-3 bg-green-50 rounded-md">
          <p className="text-sm text-green-700 font-medium">
            ✓ Approved on {formatDate(request.approvedAt)}
            {request.respondedBy && ` by ${request.respondedBy.name}`}
          </p>
        </div>
      )}

      {/* Cancellation Info */}
      {request.status === "cancelled" && request.cancelReason && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700 font-medium mb-1">Cancelled by Student</p>
          <p className="text-sm text-gray-600">{request.cancelReason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            setSelectedRequest(request);
            setShowDetailModal(true);
          }}
          className="flex items-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4 mr-1.5" />
          View Details
        </button>

        {request.status === "pending" && (
          <>
            <button
              onClick={() => handleApprove(request._id)}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Approve
            </button>
            <button
              onClick={() => {
                setSelectedRequest(request);
                setShowRejectModal(true);
              }}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-600 mt-1">Review and manage student leave requests</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === "pending"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock className="w-5 h-5 inline mr-2" />
            Pending
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === "all"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            All Requests
          </button>
        </div>

        {/* Filters (Only for All tab) */}
        {activeTab === "all" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-gray-600 mr-2" />
                <span className="font-medium">Filters</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={fetchAllRequests}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    <Search className="w-4 h-4 inline mr-1" />
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={activeTab === "pending" ? fetchPendingRequests : fetchAllRequests}
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
            {activeTab === "pending" && pendingRequests.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">No pending requests</p>
                <p className="text-gray-500 text-sm mt-2">All leave requests have been processed</p>
              </div>
            )}

            {activeTab === "all" && allRequests.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No leave requests found</p>
              </div>
            )}

            {activeTab === "pending" && pendingRequests.map(renderRequestCard)}
            {activeTab === "all" && allRequests.map(renderRequestCard)}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-semibold">Leave Request Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Student Information</h4>
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

              {/* Leave Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Leave Type</p>
                  <div className="mt-1 flex items-center">
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
                  <p className="text-sm text-gray-500">Batch</p>
                  <p className="font-medium">{selectedRequest.batchId?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Applied On</p>
                  <p className="font-medium">{formatDate(selectedRequest.appliedAt)}</p>
                </div>
                {selectedRequest.approvedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Approved On</p>
                    <p className="font-medium">{formatDate(selectedRequest.approvedAt)}</p>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Reason</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedRequest.reason}</p>
                </div>
              </div>

              {/* Remarks */}
              {selectedRequest.studentRemark && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-2">Student&apos;s Remark (Resent)</p>
                  <p className="text-blue-600">{selectedRequest.studentRemark}</p>
                </div>
              )}

              {selectedRequest.teacherRemark && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 font-medium mb-2">Your Rejection Remark</p>
                  <p className="text-red-600">{selectedRequest.teacherRemark}</p>
                </div>
              )}

              {selectedRequest.cancelReason && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 font-medium mb-2">Cancellation Reason</p>
                  <p className="text-gray-600">{selectedRequest.cancelReason}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              {selectedRequest.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedRequest._id);
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reject Leave Request</h3>
              <p className="text-sm text-gray-500 mt-1">
                Student: {selectedRequest.studentId?.name} ({selectedRequest.studentId?.studentCode})
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    Student will have 48 hours to resend this request with a remark. After that, the request will be automatically closed.
                  </p>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Remark <span className="text-red-500">*</span>
              </label>
              <textarea
                value={teacherRemark}
                onChange={(e) => setTeacherRemark(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Please provide a clear reason for rejection..."
              />
              <p className="mt-1 text-sm text-gray-500">
                This remark will be visible to the student
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setTeacherRemark("");
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !teacherRemark.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Rejecting..." : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLeaveManagement;
