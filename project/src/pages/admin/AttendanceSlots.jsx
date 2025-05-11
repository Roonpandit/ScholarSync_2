import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { FiPlus, FiRefreshCw, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi'
import { adminApi } from '../../services/api'
import DataTable from '../../components/tables/DataTable'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'react-toastify'
import { SHIFTS } from '../../config/constants'

export default function AdminAttendanceSlots() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [formData, setFormData] = useState({
    shift: SHIFTS.MORNING,
    date: new Date(),
    startTime: new Date().setHours(9, 0, 0),
    endTime: new Date().setHours(9, 30, 0)
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch attendance slots data
  const fetchAttendanceSlots = async (date = null) => {
    try {
      setLoading(true)
      const formattedDate = date ? format(date, 'yyyy-MM-dd') : null
      const response = await adminApi.getAttendanceSlots(formattedDate)
      setSlots(response.data.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching attendance slots:', err)
      setError('Failed to load attendance slots. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceSlots(selectedDate)
  }, [selectedDate])

  // Handle date filter change
  const handleDateChange = (date) => {
    setSelectedDate(date)
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  // Handle time input changes
  const handleTimeChange = (name, time) => {
    setFormData({
      ...formData,
      [name]: time
    })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Format the data for API submission
      const startTime = new Date(formData.startTime)
      const endTime = new Date(formData.endTime)
      const date = format(formData.date, 'yyyy-MM-dd')
      
      // Set start and end time hours on the selected date
      const formattedStartTime = new Date(`${date}T${format(startTime, 'HH:mm:ss')}.000Z`)
      const formattedEndTime = new Date(`${date}T${format(endTime, 'HH:mm:ss')}.000Z`)
      
      const slotData = {
        shift: formData.shift,
        date,
        startTime: formattedStartTime.toISOString(),
        endTime: formattedEndTime.toISOString()
      }
      
      const response = await adminApi.createAttendanceSlot(slotData)
      
      if (response.data.success) {
        toast.success('Attendance slot created successfully')
        setShowModal(false)
        
        // Reset form data
        setFormData({
          shift: SHIFTS.MORNING,
          date: new Date(),
          startTime: new Date().setHours(9, 0, 0),
          endTime: new Date().setHours(9, 30, 0)
        })
        
        // Refresh slots list
        fetchAttendanceSlots(selectedDate)
      }
    } catch (err) {
      console.error('Error creating attendance slot:', err)
      toast.error('Failed to create attendance slot. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle closing a slot
  const handleCloseSlot = async (slotId) => {
    try {
      const response = await adminApi.closeAttendanceSlot(slotId)
      
      if (response.data.success) {
        toast.success('Attendance slot closed successfully')
        
        // Refresh slots list
        fetchAttendanceSlots(selectedDate)
      }
    } catch (err) {
      console.error('Error closing attendance slot:', err)
      toast.error('Failed to close attendance slot. Please try again.')
    }
  }

  // Table columns definition
  const columns = [
    {
      key: 'shift',
      label: 'Shift',
      sortable: true,
      render: (value) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    {
      key: 'startTime',
      label: 'Start Time',
      sortable: true,
      render: (value) => format(new Date(value), 'h:mm a')
    },
    {
      key: 'endTime',
      label: 'End Time',
      sortable: true,
      render: (value) => format(new Date(value), 'h:mm a')
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
          {value ? 'Active' : 'Closed'}
        </span>
      )
    },
    {
      key: 'createdBy.name',
      label: 'Created By',
      sortable: true
    },
    {
      key: 'isActive',
      label: 'Actions',
      sortable: false,
      render: (value, item) => (
        value ? (
          <button
            onClick={() => handleCloseSlot(item._id)}
            className="text-sm px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
          >
            Close Slot
          </button>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Closed
          </span>
        )
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Attendance Slots</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage attendance slots
          </p>
        </div>
        
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => fetchAttendanceSlots(selectedDate)}
            className="btn btn-outline flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Create Slot
          </button>
        </div>
      </div>
      
      {/* Date filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Date
            </label>
            <DatePicker
              id="date-filter"
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="MMMM d, yyyy"
              className="form-input py-2"
              placeholderText="Select date"
            />
          </div>
          
          <div className="flex-1 ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Slots for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {slots.length} slots found
            </p>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Slots table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={slots}
          title="Attendance Slots"
          itemsPerPage={10}
        />
      )}
      
      {/* Create Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowModal(false)}></div>
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Attendance Slot</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Shift selection */}
                  <div>
                    <label htmlFor="shift" className="form-label">Shift</label>
                    <select
                      id="shift"
                      name="shift"
                      value={formData.shift}
                      onChange={handleChange}
                      className="form-input"
                    >
                      <option value={SHIFTS.MORNING}>Morning</option>
                      <option value={SHIFTS.AFTERNOON}>Afternoon</option>
                      <option value={SHIFTS.EVENING}>Evening</option>
                    </select>
                  </div>
                  
                  {/* Date input */}
                  <div>
                    <label htmlFor="date" className="form-label">Date</label>
                    <DatePicker
                      id="date"
                      selected={formData.date}
                      onChange={(date) => setFormData({ ...formData, date })}
                      dateFormat="MMMM d, yyyy"
                      className="form-input w-full py-2"
                      placeholderText="Select date"
                    />
                  </div>
                  
                  {/* Start Time input */}
                  <div>
                    <label htmlFor="startTime" className="form-label">Start Time</label>
                    <DatePicker
                      id="startTime"
                      selected={formData.startTime}
                      onChange={(time) => handleTimeChange('startTime', time)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className="form-input w-full py-2"
                      placeholderText="Select start time"
                    />
                  </div>
                  
                  {/* End Time input */}
                  <div>
                    <label htmlFor="endTime" className="form-label">End Time</label>
                    <DatePicker
                      id="endTime"
                      selected={formData.endTime}
                      onChange={(time) => handleTimeChange('endTime', time)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className="form-input w-full py-2"
                      placeholderText="Select end time"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : 'Create Slot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}