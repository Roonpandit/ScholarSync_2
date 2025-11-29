import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { Calendar, Clock, Mail } from "lucide-react";
import { formatTime, formatDate } from '../../utils/timeUtils';
import Loader from "../../components/Loader";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    pending: 0,
    awaitingApproval: 0,
    total: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get current date info
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const firstDay = new Date(currentYear, currentMonth - 1, 1);
        const lastDay = new Date(currentYear, currentMonth, 0);

        // Fetch all slots
        const slotsRes = await axios.get("/students/attendance-slots");
        const allSlots = slotsRes.data.data || [];

        // Set all slots directly
        setSlots(allSlots);

        // Fetch attendance history for the current month
        const attendanceRes = await axios.get(
          `/students/attendance?startDate=${
            firstDay.toISOString().split("T")[0]
          }&endDate=${lastDay.toISOString().split("T")[0]}`
        );
        const attendanceData = attendanceRes.data.data || [];
        setRecentAttendance(attendanceData.slice(0, 5));

        // Fetch absence history for current month
        const absenceRes = await axios.get(
          `/students/absences?month=${currentMonth}&year=${currentYear}`
        );

        // Calculate stats by counting records with specific statuses
        const present = attendanceData.filter(record => record.status === 'present').length;
        const awaitingApproval = attendanceData.filter(record => record.status === 'awaiting_approval').length;
        const totalClosedSlots = absenceRes.data.totalClosedSlots || 0;
        const totalAbsences = absenceRes.data.totalAbsences || 0;
        const totalPending = absenceRes.data.totalPending || 0;

        setAttendanceStats({
          present,
          absent: totalAbsences,
          pending: totalPending,
          awaitingApproval: awaitingApproval,
          total: present + totalAbsences + totalPending + awaitingApproval,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  const calculateAttendancePercentage = (stats) => {
    const totalCountedSlots = stats.total - stats.pending - stats.awaitingApproval;
    return totalCountedSlots > 0
      ? Math.round((stats.present / totalCountedSlots) * 100)
      : 0;
  };

  // Then use it like this:
  const attendancePercentage = calculateAttendancePercentage(attendanceStats);

  // Count active and upcoming slots
  const activeSlotCount = slots.filter(slot => slot.status === 'active').length;
  const upcomingSlotCount = slots.filter(slot => slot.status === 'upcoming').length;

  // Format date and time from UTC to local time


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Student Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center">
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-2 rounded-full bg-green-500"></span>
            System Online
          </span>
          <p className="ml-4 text-gray-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-b-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Attendance Rate
              </h3>
              <p className="text-3xl font-bold text-gray-800">
                {attendancePercentage}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${attendancePercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/student/mark-attendance"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              View All Slots
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-b-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Present
              </h3>
              <p className="text-3xl font-bold text-gray-800">
                {attendanceStats.present}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/student/attendance-history"
              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
            >
              View History
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-b-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Awaiting Approval
              </h3>
              <p className="text-3xl font-bold text-gray-800">
                {attendanceStats.awaitingApproval}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-orange-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/student/absence-history"
              className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
            >
              View Details
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-b-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Active Slots
              </h3>
              <p className="text-3xl font-bold text-gray-800">
                {activeSlotCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-purple-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/student/mark-attendance"
              className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
            >
              View Slots
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-b-4 border-yellow-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Pending Slots
              </h3>
              <p className="text-3xl font-bold text-gray-800">
                {attendanceStats.pending}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/student/absence-history"
              className="text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center"
            >
              View List
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-b-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Absent
              </h3>
              <p className="text-3xl font-bold text-gray-800">
                {attendanceStats.absent}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/student/absence-history"
              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
            >
              View List
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Attendance Slots
                </h2>
              </div>
              <Link
                to="/student/mark-attendance"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View Slots
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
            {slots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slots.filter(slot => slot.status === 'active' || slot.status === 'upcoming').map((slot) => (
                  <div
                    key={slot._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {slot.shift.charAt(0).toUpperCase() + slot.shift.slice(1)}
                          {" "}Attendance
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Date: {formatDate(slot.date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Time: {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Status: {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          slot.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : slot.status === 'upcoming' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      {slot.status === 'active' ? (
                        <Link
                          to={`/student/mark-attendance?slotId=${slot._id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          Mark Attendance
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-200 cursor-not-allowed"
                        >
                          Mark Attendance
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-600">No slots available.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Quick Actions
            </h2>

            <div className="space-y-4">
              <Link
                to="/student/mark-attendance"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    Mark Attendance
                  </p>
                  <p className="text-xs text-gray-500">
                    Register your attendance for today
                  </p>
                </div>
                <div className="ml-auto">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </Link>

              <Link
                to="/student/leave-management"
                className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    Leave Management
                  </p>
                  <p className="text-xs text-gray-500">
                    Apply and manage leave requests
                  </p>
                </div>
                <div className="ml-auto">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;