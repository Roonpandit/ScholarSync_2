import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Calendar, Clock } from "lucide-react";
import {
  formatDate,
  formatTime,
  convertToIST
} from "../../utils/timeUtils";
import Loader from "../../components/Loader";

const AbsenceHistory = () => {
  const [attendanceData, setAttendanceData] = useState({
    absences: [],
    pending: [],
    awaitingApproval: [],
    totalAbsences: 0,
    totalPending: 0,
    totalAwaitingApproval: 0,
    totalClosedSlots: 0,
    totalActiveSlots: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1, // Current month (1-12)
    year: new Date().getFullYear(), // Current year
  });

  useEffect(() => {
    fetchAbsenceHistory();
  }, [filters]);

  const fetchAbsenceHistory = async () => {
    try {
      setLoading(true);
      const { month, year } = filters;

      // Ensure month and year are valid numbers
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
        throw new Error("Invalid month or year");
      }

      // Fetch absence data for table display (absences, pending, awaiting approval lists)
      const absenceRes = await axios.get(
        `/students/absences?month=${month}&year=${year}`
      );
      setAttendanceData(absenceRes.data);
    } catch (error) {
      console.error("Error fetching absence history:", error);
      toast.error("Failed to load absence history");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleDateString("en-US", { month: "long" });
  };

  if (loading) {
    return <Loader message="Loading absence history..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Absence History
          </h1>
          <p className="text-gray-600 mt-1">
            Track your absences, pending slots, and attendance awaiting approval.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 sm:mb-0">
                Your Absences
              </h2>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center">
                  <label
                    htmlFor="month"
                    className="block text-sm font-medium text-gray-700 mr-2"
                  >
                    Month:
                  </label>
                  <select
                    id="month"
                    name="month"
                    value={filters.month}
                    onChange={handleFilterChange}
                    className="border border-gray-300 rounded-md py-1.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label
                    htmlFor="year"
                    className="block text-sm font-medium text-gray-700 mr-2"
                  >
                    Year:
                  </label>
                  <select
                    id="year"
                    name="year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    className="border border-gray-300 rounded-md py-1.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() - i}>
                        {new Date().getFullYear() - i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <>
                {attendanceData.totalAbsences === 0 && attendanceData.totalPending === 0 && attendanceData.totalAwaitingApproval === 0 ? (
                  <div className="text-gray-600 text-lg mb-2">
                    No absences, pending slots, or awaiting approval records in this month
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Date
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Shift
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Slot Time
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {[
                            ...attendanceData.absences.map(absence => ({
                              ...absence,
                              type: 'absence'
                            })),
                            ...attendanceData.pending.map(pending => ({
                              ...pending,
                              type: 'pending'
                            })),
                            ...(attendanceData.awaitingApproval || []).map(awaiting => ({
                              ...awaiting,
                              type: 'awaiting_approval'
                            }))
                          ].sort((a, b) => new Date(a.date) - new Date(b.date)).map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {formatDate(item.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {item.shift.charAt(0).toUpperCase() + item.shift.slice(1)}

                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-500">
                                  {formatTime(item.slotStartTime)} - {formatTime(item.slotEndTime)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.type === 'absence'
                                    ? 'bg-red-100 text-red-800'
                                    : item.type === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
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
                )}
              </>
            )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Attendance Policy</h2>

        <div className="text-sm text-gray-600">
          <p className="mb-3">
            Students are expected to maintain regular attendance. Maintaining good attendance
            is crucial for academic performance and course completion.
          </p>
          <ul className="list-disc list-inside space-y-2 mb-3">
            <li>
              90% or above:{" "}
              <span className="text-green-600 font-medium">Excellent - Good standing</span>
            </li>
            <li>
              75% to 89%:{" "}
              <span className="text-yellow-600 font-medium">
                Warning - Needs improvement
              </span>
            </li>
            <li>
              Below 75%:{" "}
              <span className="text-red-600 font-medium">Critical - Action required</span>
            </li>
          </ul>
          <p className="mb-3">
            <strong>Note:</strong> Slots marked as "Awaiting Approval" are not counted in your attendance
            percentage until approved by your teacher.
          </p>
          <p>
            If your attendance is below 75%, please contact the
            administration office to discuss your situation and possible remedies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AbsenceHistory;
