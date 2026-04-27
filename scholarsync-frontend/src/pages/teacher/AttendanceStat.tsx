import React, { useState, useEffect, Component, type ReactNode, type ErrorInfo } from 'react';
import { toast } from 'react-toastify';
import {
  Calendar,
  ChevronRight,
  BarChart,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatDateDisplay, convertToIST } from '@/utils/timeUtils';
import Loader from '@/components/Loader';
import { get } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';

interface StudentInfo {
  id: string;
  name: string;
  studentCode: string;
}

interface AbsentDateInfo {
  date: string;
  shift: string;
}

interface StudentStat {
  student: StudentInfo;
  present: number;
  absent: number;
  totalDays: number;
  absentDates: AbsentDateInfo[];
}

interface StatsApiResponse {
  success: boolean;
  data: {
    stats: {
      totalSlots: number;
      studentsWithAbsences: Array<{
        student: StudentInfo;
        present: number;
        absent: number;
      }>;
    };
  };
}

interface AbsentApiResponse {
  data: Array<{
    student: StudentInfo;
    absentDates: AbsentDateInfo[];
  }>;
}

interface FiltersState {
  month: number;
  year: number;
  minAbsences: number;
  search: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
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

const AttendanceStat = () => {
  const [stats, setStats] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<FiltersState>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    minAbsences: 5,
    search: '',
  });
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [filteredStats, setFilteredStats] = useState<StudentStat[]>([]);

  useEffect(() => {
    fetchAttendanceStats();
  }, []);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const { month, year, minAbsences } = filters;

      if (!month || !year) {
        console.error('Month and year are required');
        toast.error('Please select both month and year');
        setStats([]);
        return;
      }

      const startDateIST = convertToIST(new Date(year, month - 1, 1));
      const endDateIST = convertToIST(new Date(year, month, 0));
      const startDate = startDateIST ? startDateIST.toISOString().split('T')[0] : '';
      const endDate = endDateIST ? endDateIST.toISOString().split('T')[0] : '';

      // Fetch both attendance stats and absent students data
      const [statsRes, absentRes] = await Promise.all([
        get<StatsApiResponse>(API_ENDPOINTS.ATTENDANCE.STATS, {
          startDate,
          endDate,
          minAbsences: minAbsences || 0,
        }),
        get<AbsentApiResponse>(API_ENDPOINTS.ATTENDANCE.ABSENT_LIST, {
          threshold: minAbsences || 1,
          month,
          year,
        }),
      ]);

      if (statsRes?.success && statsRes?.data?.stats) {
        const statsData = statsRes.data.stats;
        const absentData = absentRes?.data || [];

        // Create a map of student IDs to their absent dates
        const absentDatesMap: Record<string, AbsentDateInfo[]> = {};
        absentData.forEach((record) => {
          if (record.student && record.student.id) {
            absentDatesMap[record.student.id] = record.absentDates || [];
          }
        });

        // Merge the data
        const formattedStats: StudentStat[] = statsData.studentsWithAbsences.map((student) => ({
          ...student,
          present: student.present,
          absent: student.absent,
          totalDays: statsData.totalSlots,
          absentDates: absentDatesMap[student.student.id] || [],
        }));

        setStats(formattedStats);
        applySearchFilter(formattedStats);
      } else {
        console.error('Invalid response format:', statsRes);
        toast.error('Received invalid data from server');
        setStats([]);
        setFilteredStats([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching attendance stats:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to load attendance statistics');
      setStats([]);
      setFilteredStats([]);
    } finally {
      setLoading(false);
    }
  };

  const applySearchFilter = (students: StudentStat[]) => {
    const searchTerm = filters.search.toLowerCase();
    if (!searchTerm) {
      setFilteredStats(students);
      return;
    }

    const filtered = students.filter(
      (student) =>
        student.student?.name?.toLowerCase().includes(searchTerm) ||
        student.student?.studentCode?.toLowerCase().includes(searchTerm)
    );

    setFilteredStats(filtered);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: name === 'minAbsences' ? parseInt(value) || 0 : value,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value,
    });
    applySearchFilter(stats);
  };

  const handleSearch = () => {
    fetchAttendanceStats();
  };

  const toggleExpandStudent = (studentId: string) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
    } else {
      setExpandedStudent(studentId);
    }
  };

  const formatDate = (dateString: string): string => {
    return formatDateDisplay(dateString);
  };

  const renderStudentRow = (stat: StudentStat): ReactNode => {
    const student = stat?.student || ({} as StudentInfo);
    const present = stat?.present || 0;
    const absent = stat?.absent || 0;
    const totalDays = present + absent;
    const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return (
      <tr key={student.id || Math.random()} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-800">{student.name?.charAt(0) || '?'}</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{student.name || 'Unknown Student'}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{student.studentCode || 'N/A'}</div>
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
                attendanceRate >= 90 ? 'bg-green-500' : attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${attendanceRate}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium text-gray-700">{attendanceRate}%</span>
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => toggleExpandStudent(student.id)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            View Details
            <ChevronRight
              size={16}
              className={`ml-1 transition-transform ${expandedStudent === student.id ? 'rotate-90' : ''}`}
            />
          </button>
        </td>
      </tr>
    );
  };

  const renderExpandedRow = (stat: StudentStat): ReactNode => {
    const student = stat?.student || ({} as StudentInfo);
    if (expandedStudent !== student.id) return null;

    // Get absent dates from the stat
    const absentDates = stat?.absentDates || [];

    return (
      <tr key={`${student.id}-details`} className="bg-gray-50">
        <td colSpan={6} className="px-6 py-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <AlertTriangle size={16} className="mr-2 text-orange-500" />
              Absent Dates & Shifts
            </h4>
            {absentDates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {absentDates.map((dateInfo, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-800 border border-red-200"
                  >
                    <Calendar size={12} className="mr-1.5" />
                    {formatDate(dateInfo.date)}
                    <span className="mx-1.5">&bull;</span>
                    <Clock size={12} className="mr-1.5" />
                    {dateInfo.shift?.charAt(0).toUpperCase() + dateInfo.shift?.slice(1)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No absence records found for this period.</p>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderMobileStudentCard = (stat: StudentStat): ReactNode => {
    const student = stat?.student || ({} as StudentInfo);
    const present = stat?.present || 0;
    const absent = stat?.absent || 0;
    const totalDays = present + absent;
    const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;
    const absentDates = stat?.absentDates || [];

    return (
      <div key={student.id || Math.random()} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div
          className="p-4 flex items-center justify-between cursor-pointer"
          onClick={() => student.id && toggleExpandStudent(student.id)}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-800">{student.name?.charAt(0) || '?'}</span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">{student.name || 'Unknown Student'}</div>
              <div className="text-xs text-gray-500">{student.studentCode || 'N/A'}</div>
            </div>
          </div>
          <ChevronRight
            size={18}
            className={`text-gray-400 transition-transform ${expandedStudent === student.id ? 'rotate-90' : ''}`}
          />
        </div>

        {expandedStudent === student.id && (
          <div className="px-4 pb-4 pt-1 bg-gray-50">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white p-2 rounded-md border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Presents</div>
                <div className="font-medium text-green-600 text-lg">{present}</div>
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
                    attendanceRate >= 90 ? 'bg-green-500' : attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
              <div className="text-xs font-medium text-gray-700">{attendanceRate}%</div>
            </div>

            {absentDates.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                  <AlertTriangle size={14} className="mr-1.5 text-orange-500" />
                  Absent Dates
                </h4>
                <div className="flex flex-col gap-2">
                  {absentDates.map((dateInfo, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-800 border border-red-200"
                    >
                      <Calendar size={12} className="mr-1 flex-shrink-0" />
                      {formatDate(dateInfo.date)}
                      <span className="mx-1">&bull;</span>
                      <Clock size={12} className="mr-1 flex-shrink-0" />
                      {dateInfo.shift}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <Loader />;
  }

  const safeStats = Array.isArray(filteredStats) ? filteredStats.filter((stat) => stat && stat.student) : [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <BarChart className="mr-2 text-blue-500" size={20} />
            Attendance Statistics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Student attendance summary and absent records</p>
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
        <div className="flex items-center mb-3">
          <Filter size={16} className="text-gray-500 mr-2" />
          <h2 className="text-sm font-medium text-gray-700">Filter Options</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
                  {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
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
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
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

          <div className="flex flex-col">
            <label htmlFor="search" className="text-xs text-gray-500 mb-1">
              Search Student
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Name or ID"
                className="border border-gray-300 rounded-md pl-9 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>

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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Presents
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Absents
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Rate
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {safeStats.map((stat) => (
                      <React.Fragment key={stat.student.id}>
                        {renderStudentRow(stat)}
                        {renderExpandedRow(stat)}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view - Card list */}
              <div className="md:hidden space-y-3">{safeStats.map(renderMobileStudentCard)}</div>
            </>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 bg-gray-50 rounded-lg">
            <div className="bg-gray-200 p-3 rounded-full">
              <BarChart size={24} className="text-gray-500" />
            </div>
            <p className="mt-4 text-center text-gray-600 text-sm px-4">
              {stats === null ? 'Error loading statistics' : 'No attendance statistics found for the selected filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const AttendanceStatWithErrorBoundary = () => (
  <ErrorBoundary>
    <AttendanceStat />
  </ErrorBoundary>
);

export default AttendanceStatWithErrorBoundary;
