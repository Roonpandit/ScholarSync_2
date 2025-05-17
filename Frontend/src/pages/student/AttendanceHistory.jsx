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
    // Calculate total days based on status
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
    const pendingDays = attendanceRecords.filter(record => record.status === 'pending').length;
    const absentDays = attendanceRecords.filter(record => record.status === 'absent').length;
    
    // Calculate attendance rate excluding pending days
    const totalExpectedDays = 20; // Assuming 20 working days per month
    const attendanceRate = totalExpectedDays > 0 ? Math.min(100, Math.round((presentDays / (totalExpectedDays - pendingDays)) * 100)) : 0;
    
    return {
      totalDays,
      presentDays,
      pendingDays,
      absentDays,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Attendance History</h2>
          <p className="text-gray-500">View your attendance records and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Present Days"
            value={stats.presentDays}
            color="green"
            icon={<CheckCircle className="w-5 h-5" />}
          />
          <StatCard
            title="Pending Days"
            value={stats.pendingDays}
            color="blue"
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            title="Absent Days"
            value={stats.absentDays}
            color="red"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <StatCard
            title="Attendance Rate"
            value={`${stats.attendanceRate}%`}
            color="green"
            icon={<BarChart2 className="w-5 h-5" />}
          />
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

          {/* Desktop View - Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shift
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.shift}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.status === 'present' && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Present
                          </span>
                        )}
                        {record.status === 'pending' && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Pending
                          </span>
                        )}
                        {record.status === 'absent' && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.markedAt ? new Date(record.markedAt).toLocaleTimeString() : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {attendanceRecords.length === 0 && (
          <div className="hidden sm:flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="rounded-full bg-yellow-100 p-2 sm:p-3 mb-3 sm:mb-4">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">No Records Found</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
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
}

export default AttendanceHistory;