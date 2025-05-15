import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

const AbsenceHistory = () => {
  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1, // Current month
    year: new Date().getFullYear() // Current year
  })

  useEffect(() => {
    fetchAbsenceHistory()
  }, [filters])

  const fetchAbsenceHistory = async () => {
    try {
      setLoading(true)
      const { month, year } = filters
      const res = await axios.get(`/students/absences?month=${month}&year=${year}`)
      setAbsences(res.data.data)
    } catch (error) {
      console.error('Error fetching absence history:', error)
      toast.error('Failed to load absence history')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({
      ...filters,
      [name]: value
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMonthName = (monthNumber) => {
    const date = new Date()
    date.setMonth(monthNumber - 1)
    return date.toLocaleString('en-US', { month: 'long' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Absence History</h1>
          <p className="text-gray-600 mt-1">Track your missed attendance days</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center">
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
            <span className="w-2 h-2 mr-2 rounded-full bg-red-500"></span>
            {absences.length > 3 ? 'Critical' : absences.length > 1 ? 'Warning' : 'Good'}
          </span>
          <p className="ml-4 text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 sm:mb-0">Your Absences</h2>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center">
                  <label htmlFor="month" className="block text-sm font-medium text-gray-700 mr-2">Month:</label>
                  <select
                    id="month"
                    name="month"
                    value={filters.month}
                    onChange={handleFilterChange}
                    className="border border-gray-300 rounded-md py-1.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mr-2">Year:</label>
                  <select
                    id="year"
                    name="year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    className="border border-gray-300 rounded-md py-1.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {[2023, 2024, 2025].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {absences.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {absences.map((absence, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(absence.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{absence.shift}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(absence.slotStartTime)} - {formatTime(absence.slotEndTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Absent
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No absences found</h3>
                <p className="mt-1 text-sm text-gray-500">No absences recorded for the selected period.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Total Absences</span>
                <span className="text-xl font-bold text-gray-900">{absences.length}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Period</span>
                <span className="text-sm text-gray-900">{getMonthName(filters.month)}, {filters.year}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    absences.length > 3 
                      ? 'bg-red-100 text-red-800' 
                      : absences.length > 1 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                  }`}
                >
                  {absences.length > 3 ? 'Critical' : absences.length > 1 ? 'Warning' : 'Good'}
                </span>
              </div>
            </div>
          </div>
          
          {absences.length > 3 && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    You have exceeded the maximum allowed absences. Please contact the administration.
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
            Students are expected to maintain regular attendance. Excessive absences may affect academic performance and course completion.
          </p>
          <ul className="list-disc list-inside space-y-2 mb-3">
            <li>Up to 2 absences per month: <span className="text-green-600 font-medium">Good standing</span></li>
            <li>3 absences per month: <span className="text-yellow-600 font-medium">Warning status</span></li>
            <li>More than 3 absences per month: <span className="text-red-600 font-medium">Critical status</span></li>
          </ul>
          <p>
            If you have reached critical status, please contact the administration office to discuss your situation.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AbsenceHistory