import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
  Stethoscope,
  Plus,
  Trash2,
  Filter,
  Eye,
  Ban,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  ChevronDown,
  Search
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

const LeaveManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for Apply Leave Tab
  const [batchTeacherPairs, setBatchTeacherPairs] = useState([{ batchId: "", teacherId: "" }]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [teachersForBatch, setTeachersForBatch] = useState({});
  const [leaveType, setLeaveType] = useState("sick");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // State for My Requests Tab
  const [activeTab, setActiveTab] = useState("apply"); // "apply" or "requests"
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filters, setFilters] = useState({
    batch: [],
    teacher: [],
    status: [],
    fromDate: "",
    toDate: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [resendRemark, setResendRemark] = useState("");

  // Fetch batches on mount
  useEffect(() => {
    fetchNonDefaultBatches();
  }, []);

  // Fetch requests when switching to requests tab
  useEffect(() => {
    if (activeTab === "requests") {
      fetchLeaveRequests();
    }
  }, [activeTab]);

  const fetchNonDefaultBatches = async () => {
    try {
      const response = await axios.get('/batches/non-default');
      setAvailableBatches(response.data.data);
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Failed to load batches");
    }
  };

  const fetchTeacherForBatch = async (batchId, index) => {
    try {
      const response = await axios.get(`/batches/${batchId}/teacher`);

      setTeachersForBatch(prev => ({
        ...prev,
        [batchId]: response.data.data
      }));

      // Auto-select the teacher
      const newPairs = [...batchTeacherPairs];
      newPairs[index].teacherId = response.data.data._id;
      setBatchTeacherPairs(newPairs);
    } catch (error) {
      console.error("Error fetching teacher:", error);
      toast.error("Failed to load teacher for this batch");
    }
  };

  const handleBatchChange = (index, batchId) => {
    const newPairs = [...batchTeacherPairs];
    newPairs[index].batchId = batchId;
    newPairs[index].teacherId = ""; // Reset teacher
    setBatchTeacherPairs(newPairs);

    if (batchId) {
      fetchTeacherForBatch(batchId, index);
    }
  };

  const addBatchTeacherPair = () => {
    setBatchTeacherPairs([...batchTeacherPairs, { batchId: "", teacherId: "" }]);
  };

  const removeBatchTeacherPair = (index) => {
    const newPairs = batchTeacherPairs.filter((_, i) => i !== index);
    setBatchTeacherPairs(newPairs);
  };

  const getMinFromDate = () => {
    const today = new Date();
    if (leaveType === "sick") {
      return today.toISOString().split("T")[0];
    } else {
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() + 3);
      return minDate.toISOString().split("T")[0];
    }
  };

  const getMaxFromDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split("T")[0];
  };

  const calculateDaysDifference = () => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();

    // Validation
    const validPairs = batchTeacherPairs.filter(pair => pair.batchId && pair.teacherId);
    if (validPairs.length === 0) {
      toast.error("Please select at least one batch-teacher pair");
      return;
    }

    if (!fromDate || !toDate) {
      toast.error("Please select leave dates");
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      toast.error("Please provide a detailed reason (at least 10 characters)");
      return;
    }

    // Validate sick leave duration
    const days = calculateDaysDifference();
    if (leaveType === "sick" && days > 2) {
      toast.error("Sick leave cannot exceed 2 days");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/student/leave/apply', {
        leaveRequests: validPairs,
        leaveType,
        fromDate,
        toDate,
        reason
      });

      toast.success(`Leave request submitted successfully! (${validPairs.length} request${validPairs.length > 1 ? 's' : ''} created)`);

      // Reset form
      setBatchTeacherPairs([{ batchId: "", teacherId: "" }]);
      setFromDate("");
      setToDate("");
      setReason("");
      setTeachersForBatch({});

      // Switch to requests tab
      setActiveTab("requests");
    } catch (error) {
      console.error("Error applying leave:", error);
      toast.error(error.response?.data?.message || "Failed to apply leave");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get('/student/leave/my-requests', {
        params: {
          ...filters,
          batch: filters.batch.length > 0 ? filters.batch : undefined,
          teacher: filters.teacher.length > 0 ? filters.teacher : undefined,
          status: filters.status.length > 0 ? filters.status : undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined
        }
      });
      setLeaveRequests(response.data.data);
      setFilteredRequests(response.data.data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error("Failed to load leave requests");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this leave request?")) {
      return;
    }

    try {
      await axios.delete(`/student/leave/${requestId}`);
      toast.success("Leave request deleted successfully");
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error(error.response?.data?.message || "Failed to delete request");
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      await axios.post(`/student/leave/${selectedRequest._id}/cancel`, { cancelReason });
      toast.success("Leave cancelled successfully");
      setShowCancelModal(false);
      setCancelReason("");
      setSelectedRequest(null);
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error(error.response?.data?.message || "Failed to cancel request");
    }
  };

  const handleResendRequest = async () => {
    if (!resendRemark.trim()) {
      toast.error("Please provide a remark for resending");
      return;
    }

    try {
      await axios.post(`/student/leave/${selectedRequest._id}/resend`, { studentRemark: resendRemark });
      toast.success("Leave request resent successfully");
      setShowResendModal(false);
      setResendRemark("");
      setSelectedRequest(null);
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error resending request:", error);
      toast.error(error.response?.data?.message || "Failed to resend request");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" />, text: "Pending" },
      approved: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" />, text: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" />, text: "Rejected" },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: <Ban className="w-3 h-3" />, text: "Cancelled" },
      closed: { color: "bg-gray-100 text-gray-600", icon: <X className="w-3 h-3" />, text: "Closed" }
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

  const canResend = (request) => {
    if (request.status !== "rejected") return false;
    if (request.resendCount >= 1) return false;
    if (!request.rejectExpiresAt) return false;

    const now = new Date();
    const expiresAt = new Date(request.rejectExpiresAt);
    return now <= expiresAt;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-600 mt-1">Apply for leave and manage your leave requests</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab("apply")}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === "apply"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Apply Leave
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === "requests"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            My Requests
          </button>
        </div>

        {/* Apply Leave Tab */}
        {activeTab === "apply" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleApplyLeave}>
              {/* Leave Type Selection */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Leave Type</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setLeaveType("sick")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      leaveType === "sick"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        leaveType === "sick" ? "bg-red-100" : "bg-gray-100"
                      }`}>
                        <Stethoscope className={`w-5 h-5 ${
                          leaveType === "sick" ? "text-red-600" : "text-gray-600"
                        }`} />
                      </div>
                      <div className="ml-3 text-left">
                        <p className="font-medium">Sick Leave</p>
                        <p className="text-sm text-gray-500">Immediate, max 2 days</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeaveType("other")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      leaveType === "other"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        leaveType === "other" ? "bg-blue-100" : "bg-gray-100"
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          leaveType === "other" ? "text-blue-600" : "text-gray-600"
                        }`} />
                      </div>
                      <div className="ml-3 text-left">
                        <p className="font-medium">Other Leave</p>
                        <p className="text-sm text-gray-500">3 days advance notice</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Batch-Teacher Selection */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Select Batch & Teacher</h3>
                  <button
                    type="button"
                    onClick={addBatchTeacherPair}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Batch
                  </button>
                </div>

                <div className="space-y-4">
                  {batchTeacherPairs.map((pair, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Batch
                          </label>
                          <select
                            value={pair.batchId}
                            onChange={(e) => handleBatchChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select Batch</option>
                            {availableBatches.map((batch) => (
                              <option key={batch._id} value={batch._id}>
                                {batch.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teacher
                          </label>
                          <input
                            type="text"
                            value={teachersForBatch[pair.batchId]?.name || ""}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                            placeholder={pair.batchId ? "Loading..." : "Select batch first"}
                          />
                        </div>
                      </div>

                      {batchTeacherPairs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBatchTeacherPair(index)}
                          className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Dates */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Leave Duration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      min={getMinFromDate()}
                      max={getMaxFromDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate || getMinFromDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {fromDate && toDate && (
                  <div className="mt-3 text-sm text-gray-600">
                    Duration: <span className="font-medium">{calculateDaysDifference()} day(s)</span>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Reason</h3>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please provide a detailed reason for your leave..."
                  required
                  minLength={10}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Minimum 10 characters required
                </p>
              </div>

              {/* Info Box */}
              <div className="p-6 border-b border-gray-200">
                <div className="bg-blue-50 rounded-lg p-4 flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You cannot mark attendance while leave is pending</li>
                      <li>Once approved, you can only cancel (not delete) the leave</li>
                      <li>Past leave slots will remain as history even after cancellation</li>
                      <li>Rejected requests can be resent only once within 48 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="p-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? "Submitting..." : "Submit Leave Request"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === "requests" && (
          <div>
            {/* Filters */}
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

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      onClick={fetchLeaveRequests}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={() => {
                        setFilters({ batch: [], teacher: [], status: [], fromDate: "", toDate: "" });
                        fetchLeaveRequests();
                      }}
                      className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Requests List */}
            <div className="space-y-4">
              {leaveRequests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No leave requests found</p>
                  <button
                    onClick={() => setActiveTab("apply")}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Apply for leave
                  </button>
                </div>
              ) : (
                leaveRequests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          request.leaveType === "sick" ? "bg-red-100" : "bg-blue-100"
                        }`}>
                          {request.leaveType === "sick" ? (
                            <Stethoscope className="w-5 h-5 text-red-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">
                            {request.leaveType === "sick" ? "Sick Leave" : "Other Leave"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(request.fromDate)} - {formatDate(request.toDate)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Batch</p>
                        <p className="font-medium">{request.batchId?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Teacher</p>
                        <p className="font-medium">{request.teacherId?.name || "N/A"}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Reason</p>
                      <p className="text-sm text-gray-700">{request.reason}</p>
                    </div>

                    {request.teacherRemark && (
                      <div className="mb-4 p-3 bg-red-50 rounded-md">
                        <p className="text-sm text-red-700 font-medium mb-1">Teacher's Remark</p>
                        <p className="text-sm text-red-600">{request.teacherRemark}</p>
                      </div>
                    )}

                    {request.status === "approved" && request.cancelReason && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700 font-medium mb-1">Cancellation Reason</p>
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
                        className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>

                      {request.status === "pending" && (
                        <button
                          onClick={() => handleDeleteRequest(request._id)}
                          className="flex items-center px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      )}

                      {request.status === "approved" && !request.isCancelled && (
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowCancelModal(true);
                          }}
                          className="flex items-center px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Cancel Leave
                        </button>
                      )}

                      {request.status === "rejected" && canResend(request) && (
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowResendModal(true);
                          }}
                          className="flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Resend
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Leave Request Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Leave Type</p>
                  <p className="font-medium capitalize">{selectedRequest.leaveType}</p>
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
                  <p className="text-sm text-gray-500">Batch</p>
                  <p className="font-medium">{selectedRequest.batchId?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teacher</p>
                  <p className="font-medium">{selectedRequest.teacherId?.name || "N/A"}</p>
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

              <div>
                <p className="text-sm text-gray-500 mb-1">Reason</p>
                <p className="text-gray-700">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.teacherRemark && (
                <div className="p-4 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700 font-medium mb-1">Teacher's Remark</p>
                  <p className="text-red-600">{selectedRequest.teacherRemark}</p>
                </div>
              )}

              {selectedRequest.studentRemark && (
                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700 font-medium mb-1">Your Remark (Resend)</p>
                  <p className="text-blue-600">{selectedRequest.studentRemark}</p>
                </div>
              )}

              {selectedRequest.cancelReason && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700 font-medium mb-1">Cancellation Reason</p>
                  <p className="text-gray-600">{selectedRequest.cancelReason}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
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

      {/* Cancel Modal */}
      {showCancelModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Cancel Leave Request</h3>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Please provide a reason for cancelling this leave request.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter cancellation reason..."
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={handleCancelRequest}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cancel Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Modal */}
      {showResendModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Resend Leave Request</h3>
            </div>

            <div className="p-6">
              <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  You can resend this request only once.
                </p>
              </div>

              {selectedRequest.teacherRemark && (
                <div className="mb-4 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700 font-medium mb-1">Teacher's Rejection Reason</p>
                  <p className="text-sm text-red-600">{selectedRequest.teacherRemark}</p>
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Remark <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resendRemark}
                onChange={(e) => setResendRemark(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Explain why you're resending this request..."
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowResendModal(false);
                  setResendRemark("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={handleResendRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Resend Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
