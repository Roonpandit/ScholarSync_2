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

const AbsenceHistory = () => {
  const [attendanceData, setAttendanceData] = useState({
    absences: [],
    pending: [],
    totalAbsences: 0,
    totalPending: 0
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

      // Send month as a number directly
      const res = await axios.get(
        `/students/absences?month=${month}&year=${year}`
      );
      setAttendanceData(res.data);
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Absence History
          </h1>
          <p className="text-gray-600 mt-1">
            Track your missed attendance days
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
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
                {attendanceData.totalAbsences === 0 && attendanceData.totalPending === 0 ? (
                  <div className="text-gray-600 text-lg mb-2">
                    No absences or pending slots in this month
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
                                  item.type === 'absence' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {item.type === 'absence' ? 'Absent' : 'Pending'}
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
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Absences:</span>
                <span className="font-semibold">{attendanceData.totalAbsences}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Slots:</span>
                <span className="font-semibold">{attendanceData.totalPending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${
                  attendanceData.absences.length > 3
                    ? "text-red-600"
                    : attendanceData.absences.length > 1
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}>
                  {attendanceData.absences.length > 3
                    ? "Critical"
                    : attendanceData.absences.length > 1
                    ? "Warning"
                    : "Good"}
                </span>
              </div>
            </div>
          </div>

          {attendanceData.absences.length > 3 && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    You have exceeded the maximum allowed absences. Please
                    contact the administration.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Absence Policy</h2>

        <div className="text-sm text-gray-600">
          <p className="mb-3">
            Students are expected to maintain regular attendance. Excessive
            absences may affect academic performance and course completion.
          </p>
          <ul className="list-disc list-inside space-y-2 mb-3">
            <li>
              Up to 2 absences per month:{" "}
              <span className="text-green-600 font-medium">Good standing</span>
            </li>
            <li>
              3 absences per month:{" "}
              <span className="text-yellow-600 font-medium">
                Warning status
              </span>
            </li>
            <li>
              More than 3 absences per month:{" "}
              <span className="text-red-600 font-medium">Critical status</span>
            </li>
          </ul>
          <p>
            If you have reached critical status, please contact the
            administration office to discuss your situation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AbsenceHistory;
