import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDate, formatTime } from '@/utils/timeUtils';
import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  AlertTriangle,
  ChevronDown,
  Filter,
  BarChart2,
  Info,
  X
} from 'lucide-react';
import Loader from '@/components/Loader';
import { get } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';
import type { ApiResponse } from '@/types/common.types';
import type { AttendanceRecord } from '@/types/attendance.types';

interface AttendanceFilters {
  month: number;
  year: number;
}

interface AttendanceStatsSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  awaitingApprovalDays: number;
  pendingDays: number;
}

interface AbsenceItem {
  date: string;
  shift: string;
  slotStartTime: string;
  slotEndTime: string;
}

interface AbsenceData {
  absences: AbsenceItem[];
  pending: AbsenceItem[];
  awaitingApproval: AbsenceItem[];
  totalAbsences: number;
  totalPending: number;
  totalAwaitingApproval: number;
  totalClosedSlots: number;
  totalActiveSlots: number;
}

interface DisplayItem extends AbsenceItem {
  type: 'absence' | 'pending' | 'awaiting_approval';
}

type TabType = 'all' | 'present' | 'absent' | 'pending';

const Attendance: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type');

  const getInitialTab = (): TabType => {
    if (typeParam === 'absent') return 'absent';
    if (typeParam === 'pending') return 'pending';
    if (typeParam === 'present') return 'present';
    return 'all';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [absenceData, setAbsenceData] = useState<AbsenceData>({
    absences: [],
    pending: [],
    awaitingApproval: [],
    totalAbsences: 0,
    totalPending: 0,
    totalAwaitingApproval: 0,
    totalClosedSlots: 0,
    totalActiveSlots: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<AttendanceFilters>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [filters, activeTab]);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const { month, year } = filters;

      if (activeTab === 'absent' || activeTab === 'pending') {
        // Fetch absence/pending data
        const absenceRes = await get<AbsenceData>(
          API_ENDPOINTS.STUDENT_ATTENDANCE.HISTORY,
          { type: 'absent', month, year }
        );
        setAbsenceData(absenceRes);
      } else {
        // Fetch all attendance records
        const res = await get<ApiResponse<AttendanceRecord[]>>(
          API_ENDPOINTS.STUDENT_ATTENDANCE.HISTORY,
          { month, year }
        );
        setAttendanceRecords(res?.data || []);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', tab);
    }
    setSearchParams(searchParams);
  };

  const getMonthName = (monthNum: number): string => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    date.setDate(1);
    return date.toLocaleString('en-IN', { month: 'long' });
  };

  const calculateStats = (): AttendanceStatsSummary => {
    const presentDays = attendanceRecords.filter((record) => record.status === 'present').length;
    const awaitingApprovalDays = attendanceRecords.filter((record) => record.status === 'awaiting_approval').length;
    const absentDays = attendanceRecords.filter((record) => record.status === 'absent').length;
    const pendingDays = attendanceRecords.filter((record) => record.status === 'pending').length;
    const totalDays = attendanceRecords.length;

    return { totalDays, presentDays, absentDays, awaitingApprovalDays, pendingDays };
  };

  const stats = calculateStats();

  const getFilteredRecords = (): AttendanceRecord[] => {
    if (activeTab === 'present') return attendanceRecords.filter(r => r.status === 'present');
    return attendanceRecords;
  };

  if (loading) {
    return <Loader />;
  }

  const filteredRecords = getFilteredRecords();

  // Build display items for absent/pending tab
  const getAbsenceDisplayItems = (): DisplayItem[] => {
    return ([
      ...absenceData.absences.map((absence): DisplayItem => ({ ...absence, type: 'absence' })),
      ...absenceData.pending.map((pending): DisplayItem => ({ ...pending, type: 'pending' })),
      ...(absenceData.awaitingApproval || []).map((awaiting): DisplayItem => ({ ...awaiting, type: 'awaiting_approval' }))
    ] as DisplayItem[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Photo Modal */}
      {photoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Attendance Photo</h3>
              <button onClick={() => setPhotoModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {selectedPhoto ? (
                <img src={selectedPhoto} alt="Attendance" className="w-full max-h-[80vh] object-contain" />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No photo available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Attendance</h2>
          <p className="text-sm sm:text-base text-gray-500">View and track your attendance history</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex-1 py-2.5 px-3 rounded-md font-medium text-sm transition-all ${
              activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTabChange('present')}
            className={`flex-1 py-2.5 px-3 rounded-md font-medium text-sm transition-all ${
              activeTab === 'present' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Present
          </button>
          <button
            onClick={() => handleTabChange('absent')}
            className={`flex-1 py-2.5 px-3 rounded-md font-medium text-sm transition-all ${
              activeTab === 'absent' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Absent
          </button>
          <button
            onClick={() => handleTabChange('pending')}
            className={`flex-1 py-2.5 px-3 rounded-md font-medium text-sm transition-all ${
              activeTab === 'pending' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending
          </button>
        </div>

        {/* Filter and Summary */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-8">
          {/* Monthly Summary Card (for all/present tabs) */}
          {(activeTab === 'all' || activeTab === 'present') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-green-50 border-b border-gray-200 flex items-center">
                <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <h3 className="ml-2 text-base sm:text-lg font-semibold text-gray-800">Monthly Summary</h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-sm sm:text-base text-gray-600">Total Present</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">{stats.presentDays}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-sm sm:text-base text-gray-600">Awaiting Approval</span>
                    <span className="text-xl sm:text-2xl font-bold text-orange-600">{stats.awaitingApprovalDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-gray-600">Total Records</span>
                    <span className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalDays}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <h3 className="ml-2 text-base sm:text-lg font-semibold text-gray-800">Filter Records</h3>
              </div>
              <div className="text-xs sm:text-sm text-blue-600">{getMonthName(filters.month)}</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="month" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Month</label>
                  <div className="relative">
                    <select id="month" name="month" value={filters.month} onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
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
                    <select id="year" name="year" value={filters.year} onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm">
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
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

        {/* Content based on tab */}
        {(activeTab === 'all' || activeTab === 'present') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <h3 className="ml-2 text-base sm:text-lg font-semibold text-gray-800">Attendance Records</h3>
              </div>
              <div className="text-xs sm:text-sm text-gray-500">{filteredRecords.length} Records</div>
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden">
              {filteredRecords.length > 0 ? (
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-xs font-medium text-gray-900">
                          <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                          {formatDate(record.date)}
                        </div>
                        <div className="text-xs capitalize text-gray-500">{record.shift}</div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 text-gray-400 mr-1" />
                          {formatTime(record.markedAt)}
                        </div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'present' ? 'bg-green-100 text-green-800'
                            : record.status === 'awaiting_approval' ? 'bg-orange-100 text-orange-800'
                            : record.status === 'absent' ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status === 'present' ? 'Present' :
                           record.status === 'awaiting_approval' ? 'Awaiting' :
                           record.status === 'absent' ? 'Absent' :
                           record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                          onClick={() => { setSelectedPhoto(record.photo?.url || null); setPhotoModalOpen(true); }}>
                          <Camera className="w-3 h-3 mr-1" />View Photo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4">
                  <h3 className="text-base font-medium text-gray-900">No Records Found</h3>
                  <p className="mt-1 text-xs text-gray-500">No attendance records found for {getMonthName(filters.month)} {filters.year}.</p>
                </div>
              )}
            </div>

            {/* Desktop View */}
            {filteredRecords.length > 0 ? (
              <div className="hidden sm:block overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                          <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                          <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2" />
                                {formatDate(record.date)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.shift.charAt(0)?.toUpperCase() + record.shift.slice(1)}</td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                record.status === 'present' ? 'bg-green-100 text-green-800'
                                  : record.status === 'awaiting_approval' ? 'bg-orange-100 text-orange-800'
                                  : record.status === 'absent' ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {record.status === 'present' ? 'Present' :
                                 record.status === 'awaiting_approval' ? 'Awaiting Approval' :
                                 record.status === 'absent' ? 'Absent' :
                                 record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                              <button className="inline-flex items-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                                onClick={() => { setSelectedPhoto(record.photo?.url || null); setPhotoModalOpen(true); }}>
                                <Camera className="w-3 h-3 mr-1 sm:mr-2" />View
                              </button>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                              <button className="inline-flex items-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                                onClick={() => { toast.info(`Location: ${record.location?.coordinates?.join(', ') || 'N/A'}`); }}>
                                <MapPin className="w-3 h-3 mr-1 sm:mr-2" />View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex flex-col items-center justify-center py-8 sm:py-12">
                <div className="rounded-full bg-yellow-100 p-2 sm:p-3 mb-3 sm:mb-4">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">No Records Found</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">No attendance records found for {getMonthName(filters.month)} {filters.year}.</p>
              </div>
            )}
          </div>
        )}

        {/* Absent/Pending Tab Content */}
        {(activeTab === 'absent' || activeTab === 'pending') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                <h3 className="ml-2 text-base sm:text-lg font-semibold text-gray-800">
                  {activeTab === 'absent' ? 'Absence History' : 'Pending Records'}
                </h3>
              </div>
            </div>

            {(() => {
              const displayItems = getAbsenceDisplayItems();
              const filteredItems = activeTab === 'pending'
                ? displayItems.filter(item => item.type === 'pending' || item.type === 'awaiting_approval')
                : displayItems;

              if (filteredItems.length === 0) {
                return (
                  <div className="p-8 text-center text-gray-600">
                    No {activeTab === 'absent' ? 'absence' : 'pending'} records found for {getMonthName(filters.month)} {filters.year}.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot Time</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.shift.charAt(0).toUpperCase() + item.shift.slice(1)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-500">{formatTime(item.slotStartTime)} - {formatTime(item.slotEndTime)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.type === 'absence' ? 'bg-red-100 text-red-800'
                                  : item.type === 'pending' ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {item.type === 'absence' ? 'Absent' : item.type === 'pending' ? 'Pending' : 'Awaiting Approval'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-4 sm:mt-6 bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100 flex items-start sm:items-center">
          <div className="rounded-full bg-blue-100 p-1.5 sm:p-2 mr-3 sm:mr-4 flex-shrink-0">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm sm:text-base text-blue-800">Attendance Policy Information</h4>
            <p className="text-xs sm:text-sm text-blue-700 mt-0.5 sm:mt-1">
              Students are required to maintain at least 90% attendance. Slots marked as &quot;Awaiting Approval&quot; are not counted until approved by your teacher.
              If your attendance is below 75%, please contact the administration office.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
