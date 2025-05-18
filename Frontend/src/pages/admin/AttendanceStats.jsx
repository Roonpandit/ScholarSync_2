import React, { useState, useEffect, Component } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Calendar,
  ChevronRight,
  BarChart,
  ArrowRight,
  AlertCircle,
  Search,
} from "lucide-react";
import PropTypes from "prop-types";
import { formatDateDisplay, formatTime24h, convertToIST, isSameDate } from '../../utils/timeUtils';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
    // You can log to an error tracking service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <div className="text-xs text-red-500 mb-4 p-2 bg-red-100 rounded">
            {this.state.errorInfo?.componentStack}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

const AttendanceStats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1, // Current month
    year: new Date().getFullYear(), // Current year
    minAbsences: 5,
  });
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    // Initial fetch when component mounts
    fetchAttendanceStats();
    // Remove the dependency on filters since we now use a search button
  }, []);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const { month, year, minAbsences } = filters;

      if (!month || !year) {
        console.error("Month and year are required");
        toast.error("Please select both month and year");
        setStats([]);
        return;
      }

      // Get start and end dates in IST
      const startDateIST = convertToIST(new Date(year, month - 1, 1));
      const endDateIST = convertToIST(new Date(year, month, 0));
      const startDate = startDateIST.toISOString().split('T')[0];
      const endDate = endDateIST.toISOString().split('T')[0];

      const res = await axios.get(
        `/admin/attendance/stats?startDate=${startDate}&endDate=${endDate}&minAbsences=${
          minAbsences || 0
        }`
      );

      if (res.data?.success && res.data?.data?.stats) {
        const statsData = res.data.data.stats;
        // Convert the stats data to match our expected format
        const formattedStats = statsData.studentsWithAbsences.map(student => ({
          ...student,
          present: student.present,
          absent: student.absent,
          totalDays: statsData.totalSlots
        }));
        setStats(formattedStats);
      } else {
        console.error("Invalid response format:", res.data);
        toast.error("Received invalid data from server");
        setStats([]);
      }
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      toast.error(
        error.response?.data?.message || "Failed to load attendance statistics"
      );
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: name === "minAbsences" ? parseInt(value) || 0 : value,
    });
  };

  const handleSearch = () => {
    fetchAttendanceStats();
  };

  const toggleExpandStudent = (studentId) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
    } else {
      setExpandedStudent(studentId);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading attendance statistics...</p>
      </div>
    );
  }

  const safeStats = Array.isArray(stats)
    ? stats.filter((stat) => stat && stat.student)
    : [];

  const renderStudentRow = (stat) => {
    const student = stat?.student || {};
    const present = stat?.present || 0;
    const absent = stat?.absent || 0;
    const totalDays = present + absent;
    const attendanceRate =
      totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return (
      <tr key={student._id || Math.random()} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-800">
                {student.name?.charAt(0) || "?"}
              </span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {student.name || "Unknown Student"}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {student.studentCode || "N/A"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            {present}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            {absent}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
            <div
              className={`h-2.5 rounded-full ${
                attendanceRate >= 90
                  ? "bg-green-500"
                  : attendanceRate >= 75
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${attendanceRate}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium text-gray-700">
            {attendanceRate}%
          </span>
        </td>
      </tr>
    );
  };

  const renderMobileStudentCard = (stat) => {
    const student = stat?.student || {};
    const present = stat?.present || 0;
    const absent = stat?.absent || 0;
    const totalDays = present + absent;
    const attendanceRate =
      totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return (
      <div
        key={student._id || Math.random()}
        className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
      >
        <div
          className="p-4 flex items-center justify-between cursor-pointer"
          onClick={() => student._id && toggleExpandStudent(student._id)}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-800">
                {student.name?.charAt(0) || "?"}
              </span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">
                {student.name || "Unknown Student"}
              </div>
              <div className="text-xs text-gray-500">
                {student.studentCode || "N/A"}
              </div>
            </div>
          </div>
          <ChevronRight
            size={18}
            className={`text-gray-400 transition-transform ${
              expandedStudent === student._id ? "rotate-90" : ""
            }`}
          />
        </div>

        {expandedStudent === student._id && (
          <div className="px-4 pb-4 pt-1 bg-gray-50">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white p-2 rounded-md border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Presents</div>
                <div className="font-medium text-green-600 text-lg">
                  {present}
                </div>
              </div>
              <div className="bg-white p-2 rounded-md border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Absents</div>
                <div className="font-medium text-red-600 text-lg">{absent}</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Attendance Rate</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div
                  className={`h-2.5 rounded-full ${
                    attendanceRate >= 90
                      ? "bg-green-500"
                      : attendanceRate >= 75
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
              <div className="text-xs font-medium text-gray-700">
                {attendanceRate}%
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <BarChart className="mr-2 text-blue-500" size={20} />
            Attendance Statistics
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Student attendance summary
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg w-full md:w-auto">
          <Calendar size={16} className="text-gray-500" />
          <span className="text-gray-600 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="flex flex-col">
            <label htmlFor="month" className="text-xs text-gray-500 mb-1">
              Month
            </label>
            <select
              id="month"
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
  <option key={month} value={month}>
    {new Date(2000, month - 1, 1).toLocaleString("default", { month: "long" })}
  </option>
))}

            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="year" className="text-xs text-gray-500 mb-1">
              Year
            </label>
            <select
              id="year"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - 2 + i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="minAbsences" className="text-xs text-gray-500 mb-1">
              Minimum Absences
            </label>
            <input
              type="number"
              id="minAbsences"
              name="minAbsences"
              min="0"
              value={filters.minAbsences}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Search Button */}
        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="w-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <Search size={18} className="mr-2" />
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-2 z-10">
          <h2 className="font-medium text-gray-700 flex items-center text-sm md:text-base">
            Student Attendance Summary
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {safeStats.length}
            </span>
          </h2>
        </div>

        {safeStats.length > 0 ? (
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
            <>
              {/* Desktop view - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Student
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Student Code
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Presents
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Absents
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Attendance Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {safeStats.map(renderStudentRow)}
                  </tbody>
                </table>
              </div>

              {/* Mobile view - Card list */}
              <div className="md:hidden space-y-3">
                {safeStats.map(renderMobileStudentCard)}
              </div>
            </>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 bg-gray-50 rounded-lg">
            <div className="bg-gray-200 p-3 rounded-full">
              <BarChart size={24} className="text-gray-500" />
            </div>
            <p className="mt-4 text-center text-gray-600 text-sm px-4">
              {stats === null
                ? "Error loading statistics"
                : "No attendance statistics found for the selected filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const AttendanceStatsWithErrorBoundary = () => (
  <ErrorBoundary>
    <AttendanceStats />
  </ErrorBoundary>
);

export default AttendanceStatsWithErrorBoundary;