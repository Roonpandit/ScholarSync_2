import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, Clock, AlertTriangle, ChevronRight, Search, Filter } from 'lucide-react';

const AbsentStudents = () => {
  const [absentStudents, setAbsentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    threshold: 2,
    month: new Date().getMonth() + 1, // Current month
    year: new Date().getFullYear(), // Current year
    search: ""
  });
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    fetchAbsentStudents();
  }, [filters.threshold, filters.month, filters.year]);

  const fetchAbsentStudents = async () => {
    try {
      setLoading(true);
      const { threshold, month, year } = filters;
      const res = await axios.get(`/admin/attendance/absent?threshold=${threshold}&month=${month}&year=${year}`);
      setAbsentStudents(res.data.data);
    } catch (error) {
      console.error('Error fetching absent students:', error);
      toast.error('Failed to load absent students');
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

  const handleSearchChange = (e) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };

  const toggleExpandStudent = (studentId) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
    } else {
      setExpandedStudent(studentId);
    }
  };

  const filteredStudents = absentStudents.filter(student => 
    student.student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
    student.student.studentCode.toLowerCase().includes(filters.search.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading absent students data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <AlertTriangle className="mr-2 text-red-500" size={20} />
            Absent Students
          </h1>
          <p className="text-gray-500 text-sm mt-1">Students with excessive absences</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg w-full md:w-auto">
          <Calendar size={16} className="text-gray-500" />
          <span className="text-gray-600 text-sm">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
            <label htmlFor="threshold" className="text-xs text-gray-500 mb-1">Minimum Absences</label>
            <input
              type="number"
              id="threshold"
              name="threshold"
              min="1"
              value={filters.threshold}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="month" className="text-xs text-gray-500 mb-1">Month</label>
            <select
              id="month"
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="year" className="text-xs text-gray-500 mb-1">Year</label>
            <select
              id="year"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="search" className="text-xs text-gray-500 mb-1">Search Student</label>
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
      </div>
      
      {/* Results */}
      <div className="bg-white rounded-lg">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-2 z-10">
          <h2 className="font-medium text-gray-700 flex items-center text-sm md:text-base">
            Students with {filters.threshold}+ Absences
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {filteredStudents.length}
            </span>
          </h2>
        </div>
        
        {filteredStudents.length > 0 ? (
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
                        Absent Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Absent Dates
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((record) => (
                      <tr key={record.student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {record.student.name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{record.student.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.student.studentCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {record.absentCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {record.absentDates.map((date, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                <Calendar size={12} className="mr-1" />
                                {formatDate(date.date)}
                                <span className="mx-1">•</span>
                                <Clock size={12} className="mr-1" />
                                {date.shift}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile view - Card list */}
              <div className="md:hidden space-y-3">
                {filteredStudents.map((record) => (
                  <div key={record.student._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleExpandStudent(record.student._id)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800">
                            {record.student.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{record.student.name}</div>
                          <div className="text-xs text-gray-500">{record.student.studentCode}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 mr-2 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {record.absentCount}
                        </span>
                        <ChevronRight 
                          size={18} 
                          className={`text-gray-400 transition-transform ${expandedStudent === record.student._id ? 'rotate-90' : ''}`} 
                        />
                      </div>
                    </div>
                    
                    {expandedStudent === record.student._id && (
                      <div className="px-4 pb-4 pt-1 bg-gray-50">
                        <h3 className="text-xs font-medium text-gray-500 mb-2">Absent Dates:</h3>
                        <div className="flex flex-col gap-2">
                          {record.absentDates.map((date, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              <Calendar size={12} className="mr-1 flex-shrink-0" />
                              {formatDate(date.date)}
                              <span className="mx-1">•</span>
                              <Clock size={12} className="mr-1 flex-shrink-0" />
                              {date.shift}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 bg-gray-50 rounded-lg">
            <div className="bg-gray-200 p-3 rounded-full">
              <AlertTriangle size={24} className="text-gray-500" />
            </div>
            <p className="mt-4 text-center text-gray-600 text-sm px-4">No students found with {filters.threshold} or more absences for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsentStudents;