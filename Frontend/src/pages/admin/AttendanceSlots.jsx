import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../../styles/AttendanceSlots.css'

const AttendanceSlots = () => {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    shift: 'morning',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: ''
  })
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchSlots()
  }, [filterDate])

  const fetchSlots = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/admin/attendance-slots?date=${filterDate}`)
      setSlots(res.data.data)
    } catch (error) {
      console.error('Error fetching attendance slots:', error)
      toast.error('Failed to load attendance slots')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Combine date with time for start and end times
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`)
      
      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        toast.error('End time must be after start time')
        return
      }

      const slotData = {
        ...formData,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
      }
      
      const res = await axios.post('/admin/attendance-slots', slotData)
      
      if (res.data.success) {
        toast.success('Attendance slot created successfully')
        setSlots([...slots, res.data.data])
        setFormData({
          shift: 'morning',
          date: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: ''
        })
        setShowAddForm(false)
        fetchSlots()
      }
    } catch (error) {
      console.error('Error creating attendance slot:', error)
      toast.error(error.response?.data?.message || 'Failed to create attendance slot')
    }
  }

  const handleCloseSlot = async (slotId) => {
    try {
      const res = await axios.put(`/admin/attendance-slots/${slotId}/close`)
      
      if (res.data.success) {
        toast.success('Attendance slot closed successfully')
        // Update the slot in the state
        setSlots(slots.map(slot => 
          slot._id === slotId ? { ...slot, isActive: false } : slot
        ))
      }
    } catch (error) {
      console.error('Error closing attendance slot:', error)
      toast.error(error.response?.data?.message || 'Failed to close attendance slot')
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading attendance slots...</p>
      </div>
    )
  }

  return (
    <div className="attendance-slots">
      <div className="page-header">
        <h1>Attendance Slots</h1>
        <button 
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Create Slot'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="add-slot-form">
          <h2>Create New Attendance Slot</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="shift">Shift</label>
              <select
                id="shift"
                name="shift"
                value={formData.shift}
                onChange={handleInputChange}
                required
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-button">Create Slot</button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="filter-container">
        <label htmlFor="filterDate">Filter by Date:</label>
        <input
          type="date"
          id="filterDate"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>
      
      <div className="slots-list">
        <h2>Attendance Slots</h2>
        
        {slots.length > 0 ? (
          <div className="table-container">
            <table className="slots-table">
              <thead>
                <tr>
                  <th>Shift</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot._id} className={slot.isActive ? 'active-slot' : 'inactive-slot'}>
                    <td>{slot.shift}</td>
                    <td>{new Date(slot.date).toLocaleDateString()}</td>
                    <td>{new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{slot.isActive ? 'Active' : 'Closed'}</td>
                    <td>
                      {slot.isActive && (
                        <button 
                          className="close-button"
                          onClick={() => handleCloseSlot(slot._id)}
                        >
                          Close Slot
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No attendance slots found for the selected date.</p>
        )}
      </div>
    </div>
  )
}

export default AttendanceSlots