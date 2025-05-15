import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Camera, 
  CheckCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart2,
  Info
} from 'lucide-react';

const AttendanceHistory = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1, // Current month
    year: new Date().getFullYear() // Current year
  });

  useEffect(() => {
    fetchAttendanceHistory();
  }, [filters]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const { month, year } = filters;
      const res = await axios.get(`/students/attendance?month=${month}&year=${year}`);
      setAttendanceRecords(res.data.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const getMonthName = (monthNum) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNum - 1];
  };

  // Calculate attendance statistics
  const calculateStats = () => {
    const totalDays = attendanceRecords.length;
    const totalExpectedDays = 20; // Assuming 20 working days per month
    const attendanceRate = totalDays > 0 ? Math.min(100, Math.round((totalDays / totalExpectedDays) * 100)) : 0;
    
    return {
      totalDays,
      attendanceRate
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading attendance history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Attendance Records</h2>
          <p className="text-sm sm:text-base text-gray-500">View and track your attendance history</p>
        </div>

        {/* Filter and Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-8">
        
          {/* Monthly Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-green-50 border-b border-gray-200 flex items-center">
              <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <h3 className="ml-2 text-base sm:text-lg font-semibold text-gray-800">Monthly Summary</h3>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-sm sm:text-base text-gray-600">Total Days Present</span>
                  <span className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalDays}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base text-gray-600">Attendance Rate</span>
                  <div className="flex items-center">
                    <div className={`font-bold text-xl sm:text-2xl ${
                      stats.attendanceRate >= 75 ? 'text-green-600' : 
                      stats.attendanceRate >= 50 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {stats.attendanceRate}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                  <div className={`h-2 sm:h-2.5 rounded-full ${
                    stats.attendanceRate >= 75 ? 'bg-green-600' : 
                    stats.attendanceRate >= 50 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} style={{ width: `${stats.attendanceRate}%` }}></div>
                </div>
              </div>
            </div>
          </div>



          {/* Filter Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sm:col-span-1">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <h3 className="ml-2 text-base sm:text-lg font-semibold text-gray-800">Filter Records</h3>
              </div>
              <div className="text-xs sm:text-sm text-blue-600">
                {getMonthName(filters.month)} {filters.year}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="month" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Month</label>
                  <div className="relative">
                    <select
                      id="month"
                      name="month"
                      value={filters.month}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{getMonthName(month)}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="year" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Year</label>
                  <div className="relative">
                    <select
                      id="year"
                      name="year"
                      value={filters.year}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                    >
                      {[2023, 2024, 2025].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Attendance Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <h3 className="ml-2 text-base sm:text-lg font-semibold text-gray-800">Attendance Records</h3>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              {attendanceRecords.length} Records
            </div>
          </div>

          {/* Mobile View - Card Layout */}
          <div className="block sm:hidden">
            {attendanceRecords.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <div key={record._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-xs font-medium text-gray-900">
                        <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                        {new Date(record.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-xs capitalize text-gray-500">
                        {record.shift}
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-3 text-xs text-gray-500">
                      <Clock className="w-3 h-3 text-gray-400 mr-1" />
                      {new Date(record.markedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => {
                          toast.info('Photo viewer not implemented yet');
                        }}
                      >
                        <Camera className="w-3 h-3 mr-1" />
                        Photo
                      </button>
                      <button
                        className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => {
                          toast.info(`Location: ${record.location.coordinates.join(', ')}`);
                        }}
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Location
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full bg-yellow-100 p-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="text-base font-medium text-gray-900">No Records Found</h3>
                <p className="mt-1 text-xs text-gray-500">
                  No attendance records found for {getMonthName(filters.month)} {filters.year}.
                </p>
              </div>
            )}
          </div>

          {/* Desktop View - Table Layout */}
          {attendanceRecords.length > 0 ? (
            <div className="hidden sm:block overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shift
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Photo
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2" />
                            {new Date(record.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 capitalize">
                          {record.shift}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2" />
                            {new Date(record.markedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button
                            className="inline-flex items-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => {
                              toast.info('Photo viewer not implemented yet');
                            }}
                          >
                            <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                            <span>View Photo</span>
                          </button>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button
                            className="inline-flex items-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => {
                              toast.info(`Location: ${record.location.coordinates.join(', ')}`);
                            }}
                          >
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                            <span>View Location</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="rounded-full bg-yellow-100 p-2 sm:p-3 mb-3 sm:mb-4">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">No Records Found</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                No attendance records found for {getMonthName(filters.month)} {filters.year}.
              </p>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-4 sm:mt-6 bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100 flex items-start sm:items-center">
          <div className="rounded-full bg-blue-100 p-1.5 sm:p-2 mr-3 sm:mr-4 flex-shrink-0">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm sm:text-base text-blue-800">Attendance Policy Information</h4>
            <p className="text-xs sm:text-sm text-blue-700 mt-0.5 sm:mt-1">
              Students are required to maintain at least 90% attendance. If you have any issues with your attendance records, please contact your academic advisor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;